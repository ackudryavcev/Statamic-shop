<?php

use Illuminate\Support\Facades\Route;

// Route::statamic('example', 'example-view', [
//    'title' => 'Example'
// ]);

Route::post('/checkout/test', [\App\Http\Controllers\TestCheckoutController::class, 'create'])
    ->middleware('throttle:20,1');
Route::get('/checkout/test/{id}', [\App\Http\Controllers\TestCheckoutController::class, 'status'])
    ->where('id', 'cs_test_[A-Za-z0-9]+')->middleware('throttle:60,1');
