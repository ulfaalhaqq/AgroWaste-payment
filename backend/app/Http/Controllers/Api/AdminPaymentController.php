<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;

class AdminPaymentController extends Controller
{
    public function __construct(protected PaymentService $paymentService) {}

    /**
     * [Admin] Konfirmasi bukti transfer manual yang diunggah pembeli.
     */
    public function confirmManualPayment(string $orderId): JsonResponse
    {
        $order = Order::with('payment.proof')->findOrFail($orderId);

        try {
            $this->paymentService->confirmManualPayment($order);

            return response()->json([
                'success' => true,
                'message' => 'Pembayaran manual berhasil dikonfirmasi.',
                'data' => $order->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}