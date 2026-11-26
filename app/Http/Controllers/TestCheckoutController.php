<?php

namespace App\Http\Controllers;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class TestCheckoutController
{
    private function stripe()
    {
        $key = config('services.stripe.test_secret');
        abort_unless(is_string($key) && str_starts_with($key, 'sk_test_'), 503, 'Stripe test checkout is not configured.');

        return Http::withToken($key)->asForm()->timeout(12)->baseUrl('https://api.stripe.com/v1');
    }

    public function create(Request $request): JsonResponse
    {
        // This sandbox quotes the demo cart. It never creates a fulfillable order.
        $cart = $request->validate([
            'items' => ['required', 'array', 'min:1', 'max:100'],
            'items.*.title' => ['required', 'string', 'max:250'],
            'items.*.cents' => ['required', 'integer', 'min:0', 'max:99999999'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:999999'],
        ])['items'];

        $lines = array_map(fn ($item) => [
            'quantity' => $item['quantity'],
            'price_data' => [
                'currency' => 'eur',
                'unit_amount' => $item['cents'],
                'product_data' => ['name' => $item['title']],
            ],
        ], $cart);

        $return = rtrim(config('app.url'), '/');
        try {
            $response = $this->stripe()->post('checkout/sessions', [
                'mode' => 'payment',
                'allowed_payment_method_types' => ['card'],
                'line_items' => $lines,
                'shipping_address_collection' => ['allowed_countries' => config('services.stripe.shipping_countries')],
                'success_url' => $return.'/payment-confirmation?checkout_session={CHECKOUT_SESSION_ID}',
                'cancel_url' => $return.'/foundation?checkout_cancelled=1',
            ]);
        } catch (ConnectionException) {
            abort(503, 'Stripe is temporarily unavailable.');
        }
        abort_unless($response->successful() && $response->json('livemode') === false && $response->json('url'), 502, 'Stripe could not start this test payment.');
        $id = $response->json('id');
        $request->session()->put('stripe_test.'.$id, true);

        return response()->json(['id' => $id, 'url' => $response->json('url')]);
    }

    public function status(Request $request, string $id): JsonResponse
    {
        abort_unless($request->session()->has('stripe_test.'.$id), 404);
        try {
            $response = $this->stripe()->get('checkout/sessions/'.$id);
        } catch (ConnectionException) {
            abort(503, 'Stripe is temporarily unavailable.');
        }
        abort_unless($response->successful(), 502);
        abort_unless($response->json('livemode') === false && $response->json('payment_status') === 'paid', 409);

        return response()->json(['cents' => $response->json('amount_total')])->header('Cache-Control', 'no-store');
    }
}
