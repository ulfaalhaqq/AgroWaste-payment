<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentProof;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

class PaymentService
{
    /**
     * Proses unggah bukti transfer manual
     */
    public function uploadManualProof(array $validatedData, UploadedFile $file): Payment
    {
        $order = Order::findOrFail($validatedData['order_id']);

        // Buat atau update record pembayaran
        $payment = Payment::updateOrCreate(
            ['order_id' => $order->id],
            [
                'id'             => Str::uuid()->toString(),
                'amount'         => $order->total_price,
                'payment_method' => 'manual',
                'status'         => 'pending'
            ]
        );

        // Simpan foto ke folder public/storage/payment_proofs
        $path = $file->store('payment_proofs', 'public');

        PaymentProof::create([
            'id'         => Str::uuid()->toString(),
            'payment_id' => $payment->id,
            'image_path' => $path,
        ]);

        // Ubah status order
        $order->update(['status' => 'menunggu_konfirmasi']);

        return $payment;
    }

    /**
     * Minta Snap Token dari server Midtrans
     */
    public function getMidtransSnapToken(Order $order): string
    {
        // Konfigurasi Midtrans
        \Midtrans\Config::$serverKey = env('MIDTRANS_SERVER_KEY');
        \Midtrans\Config::$isProduction = false; // Sandbox mode untuk MVP
        \Midtrans\Config::$isSanitized = true;
        \Midtrans\Config::$is3ds = true;

        $params = [
            'transaction_details' => [
                'order_id'     => $order->order_number,
                'gross_amount' => (int) $order->total_price,
            ],
            // Midtrans butuh info customer dari relasi order->user
            'customer_details'    => [
                'first_name' => $order->user->name,
                'email'      => $order->user->email,
            ]
        ];

        // Dapatkan token
        $snapToken = \Midtrans\Snap::getSnapToken($params);

        // Simpan token ke database
        Payment::updateOrCreate(
            ['order_id' => $order->id],
            [
                'id'             => Str::uuid()->toString(),
                'amount'         => $order->total_price,
                'payment_method' => 'midtrans',
                'status'         => 'pending',
                'snap_token'     => $snapToken,
            ]
        );

        return $snapToken;
    }
}