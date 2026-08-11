<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UploadPaymentProofRequest;
use App\Models\Order;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(protected PaymentService $paymentService) {}

    /**
     * Endpoint untuk Pembeli mengunggah bukti transfer manual
     */
    public function uploadManualProof(UploadPaymentProofRequest $request): JsonResponse
    {
        $payment = $this->paymentService->uploadManualProof(
            $request->validated(),
            $request->file('proof_image')
        );

        return response()->json([
            'success' => true,
            'message' => 'Bukti pembayaran berhasil diunggah. Menunggu konfirmasi peternak.',
            'data'    => $payment
        ], 200);
    }

    /**
     * Endpoint untuk Frontend meminta Token Midtrans
     */
    public function getSnapToken(Request $request): JsonResponse
    {
        $request->validate(['order_id' => 'required|uuid|exists:orders,id']);
        $order = Order::findOrFail($request->order_id);

        // Keamanan: Pastikan pesanan ini benar milik user yang sedang login
        if ($order->user_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $token = $this->paymentService->getMidtransSnapToken($order);

        return response()->json([
            'success' => true,
            'message' => 'Snap token berhasil didapatkan.',
            'data'    => ['snap_token' => $token]
        ], 200);
    }

    /**
     * Webhook Endpoint: Dipanggil otomatis oleh server Midtrans (Bukan oleh Frontend)
     */
    public function midtransWebhook(Request $request): JsonResponse
    {
        $serverKey = env('MIDTRANS_SERVER_KEY');
        
        // Validasi keamanan dari Midtrans
        $hashed = hash("sha512", $request->order_id . $request->status_code . $request->gross_amount . $serverKey);
        if ($hashed !== $request->signature_key) {
            return response()->json(['message' => 'Invalid signature'], 403);
        }

        // Cari pesanan berdasarkan nomor order (AGW-YYYY-XXXXX)
        $order = Order::where('order_number', $request->order_id)->first();
        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        // Jika pembayaran sukses, ubah status order dan payment
        if ($request->transaction_status == 'settlement' || $request->transaction_status == 'capture') {
            $order->update(['status' => 'dikonfirmasi']); 
            
            $payment = $order->payment;
            if ($payment) {
                $payment->update(['status' => 'sukses']);
            }
        }

        return response()->json(['message' => 'Webhook berhasil diproses'], 200);
    }
}