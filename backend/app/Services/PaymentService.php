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
use App\Models\User;
use App\Models\WalletTopup;

class PaymentService
{
    /**
     * Persentase fee platform yang dipotong dari harga limbah (subtotal_produk),
     * bukan dari ongkir.
     */
    protected const PLATFORM_FEE_PERCENT = 5;

    /**
     * Proses unggah bukti transfer manual.
     *
     * PENTING: method ini SENGAJA tidak mengubah status order. Order
     * tetap "menunggu_pembayaran" sampai admin memverifikasi buktinya
     * lewat confirmManualPayment(). Ini mencegah peternak bisa Terima/
     * Tolak pesanan yang belum pasti dibayar (bukti bisa saja palsu/
     * belum dicek siapapun).
     */
    public function uploadManualProof(array $validatedData, UploadedFile $file): Payment
    {
        $order = Order::findOrFail($validatedData['order_id']);

        // Buat atau update record pembayaran
        $payment = Payment::updateOrCreate(
            ['order_id' => $order->id],
            [
                'id' => Str::uuid()->toString(),
                'amount' => $order->total_price,
                'payment_method' => 'manual',
                'status' => 'pending'
            ]
        );

        // Simpan foto ke folder public/storage/payment_proofs
        $path = $file->store('payment_proofs', 'public');

        PaymentProof::create([
            'id' => Str::uuid()->toString(),
            'payment_id' => $payment->id,
            'image_path' => $path,
        ]);

        // Status order TIDAK diubah di sini. Lihat catatan di docblock.

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
                'order_id' => $order->order_number,
                'gross_amount' => (int) $order->total_price,
            ],
            // Midtrans butuh info customer dari relasi order->user
            'customer_details' => [
                'first_name' => $order->user->name,
                'email' => $order->user->email,
            ]
        ];

        // Dapatkan token
        $snapToken = \Midtrans\Snap::getSnapToken($params);

        // Simpan token ke database
        Payment::updateOrCreate(
            ['order_id' => $order->id],
            [
                'id' => Str::uuid()->toString(),
                'amount' => $order->total_price,
                'payment_method' => 'midtrans',
                'status' => 'pending',
                'snap_token' => $snapToken,
            ]
        );

        return $snapToken;
    }

    /**
     * Generate Snap Token untuk top up saldo wallet (bukan pembayaran order).
     * Reference number pakai prefix "TOPUP-" supaya webhook bisa bedain ini
     * dari pembayaran order biasa yang pakai prefix "AGW-".
     */
    public function getTopUpSnapToken(User $user, float $amount): string
    {
        \Midtrans\Config::$serverKey = env('MIDTRANS_SERVER_KEY');
        \Midtrans\Config::$isProduction = false;
        \Midtrans\Config::$isSanitized = true;
        \Midtrans\Config::$is3ds = true;

        $reference = 'TOPUP-' . strtoupper(Str::random(8));

        WalletTopup::create([
            'id' => Str::uuid()->toString(),
            'user_id' => $user->id,
            'reference' => $reference,
            'amount' => $amount,
            'status' => 'pending',
        ]);

        $params = [
            'transaction_details' => [
                'order_id' => $reference,
                'gross_amount' => (int) $amount,
            ],
            'customer_details' => [
                'first_name' => $user->name,
                'email' => $user->email,
            ],
        ];

        return \Midtrans\Snap::getSnapToken($params);
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
                'id' => Str::uuid()->toString(),
                'source' => 'transaction_fee',
                'order_id' => $order->id,
                'user_id' => $order->peternak_id,
                'amount' => $feeAdmin,
            ]);
        });
    }

    /**
     * Refund penuh ke wallet pembeli saat pesanan ditolak peternak,
     * untuk pesanan yang sudah lunas dibayar (Midtrans/Manual/Wallet).
     * Nominal yang dikembalikan adalah total_price penuh (subtotal
     * produk + ongkir), karena pembeli sudah membayar semuanya sekaligus.
     *
     * Wallet pembeli memakai model Wallet yang sama dengan peternak/kurir,
     * hanya dibedakan dari user_id pemiliknya.
     */
    public function refundBuyerWallet(Order $order): void
    {
        DB::transaction(function () use ($order) {
            $wallet = Wallet::firstOrCreate(
                ['user_id' => $order->user_id],
                ['id' => Str::uuid()->toString(), 'balance' => 0]
            );

            $wallet->increment('balance', (float) $order->total_price);
        });
    }

    /**
     * Admin memverifikasi bukti transfer manual yang diunggah pembeli.
     * Ini SATU-SATUNYA titik yang boleh memindahkan order dari
     * "menunggu_pembayaran" ke "menunggu_konfirmasi" untuk metode manual
     * (peternak baru bisa mulai Terima/Tolak setelah ini) — sama seperti
     * alur setelah webhook Midtrans settlement. Tidak ada kredit wallet
     * di sini; wallet peternak baru terisi saat peternak klik "Terima"
     * pesanan, konsisten dengan alur QRIS.
     *
     * @throws \Exception jika order bukan metode manual, belum ada bukti
     *                     diunggah, atau order sudah diproses sebelumnya
     */
    public function confirmManualPayment(Order $order): void
    {
        if ($order->metode_pembayaran !== 'manual') {
            throw new \Exception('Pesanan ini bukan metode transfer manual.');
        }

        $payment = $order->payment;
        if (!$payment || !$payment->proof) {
            throw new \Exception('Belum ada bukti transfer yang diunggah untuk pesanan ini.');
        }

        if ($order->status !== 'menunggu_pembayaran') {
            throw new \Exception('Pesanan ini sudah diproses sebelumnya.');
        }

        DB::transaction(function () use ($order, $payment) {
            $payment->update(['status' => 'sukses']);
            $order->update(['status' => 'menunggu_konfirmasi']);
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

    /**
     * Khusus COD + Pickup (tanpa kurir/shipment). Uang sudah 100% di
     * tangan peternak secara fisik sejak pembeli mengambil barang —
     * tidak ada apapun yang lewat platform. Yang perlu dicatat cuma
     * kewajiban fee 5% platform, langsung dipotong dari wallet peternak
     * tanpa menunggu verifikasi apapun (beda dari COD+logistik yang
     * masih perlu tahap setor & verifikasi admin, karena di situ ada
     * uang fisik yang benar-benar berpindah lewat kurir).
     *
     * PENTING: saldo wallet peternak BISA MINUS kalau dia belum punya
     * saldo cukup (misal ini transaksi pertamanya). Ini valid dan
     * disengaja — dianggap sebagai utang fee yang akan otomatis
     * terlunasi begitu peternak dapat kredit dari transaksi lain
     * (QRIS/Manual/Wallet/COD+logistik). Selama saldo minus, penarikan
     * otomatis terblokir oleh validasi minimal Rp 20.000 yang sudah ada.
     */
    public function chargeCodPickupFee(Order $order): void
    {
        DB::transaction(function () use ($order) {
            $feeAdmin = round(((float) $order->subtotal_produk) * self::PLATFORM_FEE_PERCENT / 100, 2);

            $wallet = Wallet::firstOrCreate(
                ['user_id' => $order->peternak_id],
                ['id' => Str::uuid()->toString(), 'balance' => 0]
            );
            $wallet->decrement('balance', $feeAdmin);

            PlatformRevenue::create([
                'id' => Str::uuid()->toString(),
                'source' => 'transaction_fee_cod_pickup',
                'order_id' => $order->id,
                'user_id' => $order->peternak_id,
                'amount' => $feeAdmin,
            ]);
        });
    }
}