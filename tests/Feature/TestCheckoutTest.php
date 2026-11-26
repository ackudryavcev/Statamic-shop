<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class TestCheckoutTest extends TestCase
{
    private array $cart = ['items' => [['title' => 'Sample', 'cents' => 450, 'quantity' => 2]]];

    public function test_live_key_cannot_start_checkout(): void
    {
        Http::fake();
        config(['services.stripe.test_secret' => 'sk_live_fixture']);
        $this->postJson('/checkout/test', $this->cart)->assertServiceUnavailable();
        Http::assertNothingSent();
    }

    public function test_sandbox_checkout_collects_shipping_and_verifies_payment(): void
    {
        config(['services.stripe.test_secret' => 'sk_test_fixture']);
        Http::fake([
            '*/sessions' => Http::response(['id' => 'cs_test_demo', 'livemode' => false, 'url' => 'https://checkout.stripe.com/test']),
            '*/cs_test_demo' => Http::sequence()
                ->push(['livemode' => false, 'payment_status' => 'unpaid'])
                ->push(['livemode' => false, 'payment_status' => 'paid', 'amount_total' => 900]),
        ]);

        $this->getJson('/checkout/test/cs_test_demo')->assertNotFound();
        $this->postJson('/checkout/test', $this->cart)->assertOk()->assertJsonPath('id', 'cs_test_demo');
        Http::assertSent(fn ($request) => $request['line_items'][0]['quantity'] === 2
            && $request['line_items'][0]['price_data']['unit_amount'] === 450
            && str_ends_with($request['success_url'], '/payment-confirmation?checkout_session={CHECKOUT_SESSION_ID}')
            && str_ends_with($request['cancel_url'], '/foundation?checkout_cancelled=1')
            && $request['allowed_payment_method_types'] === ['card']
            && in_array('NL', $request['shipping_address_collection']['allowed_countries']));
        $this->getJson('/checkout/test/cs_test_demo')->assertConflict();
        $this->getJson('/checkout/test/cs_test_demo')->assertOk()->assertJsonPath('cents', 900);
    }
}
