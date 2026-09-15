<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Str;

class OrderService
{
    public function __construct(protected PaymentService $paymentService) {}

    public function createOrder(array $data, User $user): Order
    {
        $pembeli = $user->buyerProfile;

        if (!$pembeli) {
            throw new \Exception('Profil pembeli tidak ditemukan.');
        }

        $product = Product::find($data['product_id']);

        // 1. Cek minimal order
        if ($data['quantity_kg'] < $product->min_order_kg) {
            throw new \Exception("Jumlah pesanan di bawah batas minimal ({$product->min_order_kg} kg).");
        }

        // 2. Cek ketersediaan stok
        if ($data['quantity_kg'] > $product->stock_kg) {
            throw new \Exception("Stok tidak mencukupi. Sisa stok: {$product->stock_kg} kg.");
        }

        // 3. Hitung total harga otomatis
        $totalPrice = $product->price * $data['quantity_kg'];

        // 4. Buat pesanan
        $order = Order::create([
            'id'               => Str::uuid()->toString(),
            'buyer_profile_id' => $pembeli->id,
            'product_id'       => $product->id,
            'quantity_kg'      => $data['quantity_kg'],
            'total_price'      => $totalPrice,
            'delivery_address' => $data['delivery_address'],
            'status'           => 'pending', 
        ]);

        // 5. Potong stok produk
        $product->decrement('stock_kg', $data['quantity_kg']);

        return $order;
    }

    /**
     * Memproses checkout dari keranjang belanja
     */
    public function checkout(array $data)
    {
        // Gunakan DB Transaction agar aman (jika error, semua data di-rollback)
        return \Illuminate\Support\Facades\DB::transaction(function () use ($data) {
            $userId = \Illuminate\Support\Facades\Auth::id();
            
            // 1. Ambil data keranjang
            $cartItems = \App\Models\CartItem::with('product.peternakProfile')->where('user_id', $userId)->get();

            if ($cartItems->isEmpty()) {
                throw new \Exception('Keranjang belanja kosong.');
            }

            $orderNumber = 'AGW-' . date('Y') . '-' . strtoupper(\Illuminate\Support\Str::random(5));
            $totalQuantity = 0;
            $subtotalProduk = 0;

            // Ongkir dihitung untuk SEMUA metode pembayaran, selama
            // pengiriman pakai kurir logistik. Titik kredit wallet kurir-nya
            // yang beda per metode (lihat completeOrder / confirmasi admin),
            // tapi nominal ongkir tetap perlu tercatat di sini untuk semuanya.
            $ongkir = $data['metode_pengiriman'] === 'logistik'
                ? (float) ($data['ongkir'] ?? 0)
                : 0;

            // 2. Buat data Order utama
            $order = \App\Models\Order::create([
                'id'                => \Illuminate\Support\Str::uuid()->toString(),
                'order_number'      => $orderNumber,
                'user_id'           => $userId, 
                'peternak_id'       => $cartItems->first()->product->peternakProfile->user_id, 
                'status'            => 'menunggu_pembayaran',
                'metode_pengiriman' => $data['metode_pengiriman'],
                'metode_pembayaran' => $data['metode_pembayaran'],
                'alamat_pengiriman' => $data['alamat_pengiriman'] ?? null,
                'total_price'       => 0,
                'subtotal_produk'   => 0,
                'ongkir'            => $ongkir,
                'quantity_kg'       => 0, 
            ]);

            // 3. Pindahkan item keranjang ke order_items & kurangi stok
            foreach ($cartItems as $item) {
                $price = (float) $item->product->price;
                $subtotal = $price * $item->quantity_kg;
                
                $subtotalProduk += $subtotal;
                $totalQuantity += $item->quantity_kg;

                // Cek stok aman sebelum memotong
                if ($item->product->stock_kg < $item->quantity_kg) {
                    throw new \Exception("Stok untuk produk {$item->product->name} tidak mencukupi.");
                }

                \App\Models\OrderItem::create([
                    'id'           => \Illuminate\Support\Str::uuid()->toString(),
                    'order_id'     => $order->id,
                    'product_id'   => $item->product_id,
                    'quantity_kg'  => $item->quantity_kg,
                    'price_per_kg' => $price,
                ]);

                // Kurangi stok produk secara langsung
                $item->product->decrement('stock_kg', $item->quantity_kg);
            }

            // Update total harga & total berat di tabel order.
            // total_price = subtotal_produk + ongkir, karena keduanya
            // dibayar sekaligus dalam satu transaksi QRIS.
            $order->update([
                'subtotal_produk' => $subtotalProduk,
                'total_price'     => $subtotalProduk + $ongkir,
                'quantity_kg'     => $totalQuantity,
            ]);

            // 4. Kosongkan keranjang setelah sukses
            \App\Models\CartItem::where('user_id', $userId)->delete();
           
            // Kirim notifikasi ke Peternak
            app(\App\Services\NotificationService::class)->send(
                $order->peternak_id, 
                'ORDER_BARU', 
                'Pesanan Baru Masuk!', 
                "Ada pesanan baru dengan nomor: {$order->order_number}"
            );
            return $order;
        });
    }

    /**
     * Peternak: Terima atau Tolak Pesanan
     */
    public function processOrderBySeller(string $orderId, string $status, ?string $reason = null)
    {
        $order = \App\Models\Order::findOrFail($orderId);

        $order->update([
            'status' => $status, // 'dikonfirmasi' atau 'ditolak' atau 'dikirim'
            'rejection_reason' => $reason
        ]);

        // Kredit wallet peternak (dipotong fee 5%) tepat saat peternak
        // menerima pesanan yang sudah lunas dibayar via Midtrans.
        // Untuk manual/COD, kredit wallet menunggu verifikasi admin
        // terpisah (lihat confirmManualPayment / confirmCodSettlement),
        // karena uangnya belum tentu benar-benar sampai ke platform.
        if ($status === 'dikonfirmasi' && $order->metode_pembayaran === 'midtrans') {
            $this->paymentService->creditSellerWallet($order);
        }

        // Kalau peternak MENOLAK pesanan yang sudah lunas dibayar via
        // Midtrans, kembalikan penuh uangnya ke wallet pembeli. Wallet
        // peternak belum pernah dikreditkan di titik ini (baru dikreditkan
        // saat "dikonfirmasi" di atas), jadi tidak perlu ada pembatalan
        // kredit di sisi peternak.
        if ($status === 'ditolak' && $order->metode_pembayaran === 'midtrans') {
            $payment = $order->payment;
            if ($payment && $payment->status === 'sukses') {
                $this->paymentService->refundBuyerWallet($order);
            }
        }

        // Jika pengiriman logistik & status dikonfirmasi/dikirim, hubungkan otomatis ke kurir
        if (($status === 'dikonfirmasi' || $status === 'dikirim') && $order->metode_pengiriman === 'logistik') {
            $shipment = \App\Models\Shipment::where('order_id', $order->id)->first();
            if (!$shipment) {
                $courierProfile = \App\Models\LogistikProfile::first();
                if ($courierProfile) {
                    \App\Models\Shipment::create([
                        'id' => \Illuminate\Support\Str::uuid()->toString(),
                        'order_id' => $order->id,
                        'logistik_profile_id' => $courierProfile->id,
                        'status' => $status === 'dikirim' ? 'sedang_berjalan' : 'dijadwalkan',
                    ]);
                }
            } else {
                if ($status === 'dikirim' && $shipment->status === 'dijadwalkan') {
                    $shipment->update(['status' => 'sedang_berjalan']);
                }
            }
        }

        $type = $status === 'dikonfirmasi' ? 'ORDER_DIKONFIRMASI' : ($status === 'dikirim' ? 'PENGIRIMAN_UPDATE' : 'ORDER_DITOLAK');
        $msg = $status === 'dikonfirmasi' ? 'Hore! Pesananmu sedang diproses oleh peternak.' : ($status === 'dikirim' ? 'Pesananmu dalam perjalanan pengiriman.' : "Maaf, pesanan ditolak dengan alasan: {$reason}");
        
        app(\App\Services\NotificationService::class)->send($order->user_id, $type, 'Status Pesanan Diperbarui', $msg);

        return $order;
    }

    /**
     * Pembeli: Konfirmasi Terima Barang
     */
    public function completeOrder(string $orderId)
    {
        $order = \App\Models\Order::findOrFail($orderId);
        $order->update(['status' => 'selesai']);

        // Kreditkan ongkir penuh ke wallet kurir HANYA kalau order ini
        // dibayar via Midtrans. Untuk manual/COD, ongkir sudah dibayar
        // tunai langsung ke kurir di luar sistem, jadi tidak perlu (dan
        // tidak boleh) dikreditkan lagi secara digital di sini.
        if ($order->metode_pembayaran === 'midtrans') {
            $this->paymentService->creditCourierWallet($order);
        }

        app(\App\Services\NotificationService::class)->send(
            $order->peternak_id, 
            'ORDER_SELESAI', 
            'Pesanan Selesai', 
            "Pembeli telah menerima pesanan {$order->order_number}. Dana siap dicairkan!"
        );

        return $order;
    }
}