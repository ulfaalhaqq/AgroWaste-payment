<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentProof;
use App\Models\PlatformRevenue;
use App\Models\Wallet;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaymentService
{
    /**
     * Persentase fee platform yang dipotong dari harga limbah (subtotal_produk),
     * bukan dari ongkir.
     */
    protected const PLATFORM_FEE_PERCENT = 5;

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

    /**
     * Dipanggil dari webhook Midtrans ketika pembayaran settlement.
     * Menghitung fee platform 5% dari harga limbah (subtotal_produk),
     * lalu menambahkan sisanya ke wallet peternak.
     *
     * Ongkir TIDAK diproses di sini — ongkir baru dikreditkan ke wallet
     * kurir setelah pesanan benar-benar selesai diantar (lihat
     * OrderService::completeOrder()), karena kurir belum tentu sudah
     * ditugaskan pada saat pembayaran baru masuk.
     */
    public function creditSellerWallet(Order $order): void
    {
        DB::transaction(function () use ($order) {
            $feeAdmin = round(((float) $order->subtotal_produk) * self::PLATFORM_FEE_PERCENT / 100, 2);
            $saldoPenjual = ((float) $order->subtotal_produk) - $feeAdmin;

            $wallet = Wallet::firstOrCreate(
                ['user_id' => $order->peternak_id],
                ['id' => Str::uuid()->toString(), 'balance' => 0]
            );
            $wallet->increment('balance', $saldoPenjual);

            PlatformRevenue::create([
                'id'         => Str::uuid()->toString(),
                'source'     => 'transaction_fee',
                'order_id'   => $order->id,
                'user_id'    => $order->peternak_id,
                'amount'     => $feeAdmin,
            ]);
        });
    }

    /**
     * Dipanggil ketika pesanan selesai diantar (buyer konfirmasi terima).
     * Mengkreditkan ongkir penuh (tanpa potongan) ke wallet kurir yang
     * ditugaskan pada shipment order ini.
     */
    public function creditCourierWallet(Order $order): void
    {
        $shipment = $order->shipment;
        if (!$shipment || !$shipment->logistik_profile_id) {
            return; // tidak ada kurir yang ditugaskan (misal self pickup)
        }

        $courierUserId = $shipment->logistikProfile->user_id ?? null;
        if (!$courierUserId) {
            return;
        }

        if ((float) $order->ongkir <= 0) {
            return; // tidak ada ongkir untuk dikreditkan
        }

        DB::transaction(function () use ($order, $courierUserId) {
            $wallet = Wallet::firstOrCreate(
                ['user_id' => $courierUserId],
                ['id' => Str::uuid()->toString(), 'balance' => 0]
            );
            $wallet->increment('balance', (float) $order->ongkir);
        });
    }
}