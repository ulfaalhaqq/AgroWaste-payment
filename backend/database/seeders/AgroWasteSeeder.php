<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Category;
use App\Models\PeternakProfile;
use App\Models\BuyerProfile;
use App\Models\Product;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Shipment;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AgroWasteSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Master Kategori Limbah lengkap dengan SLUG sesuai struktur DB
        $kategoriPadat = Category::create([
            'id' => Str::uuid()->toString(), 
            'name' => 'kotoran_padat',
            'slug' => 'kotoran-padat'
        ]);
        
        $kategoriCair  = Category::create([
            'id' => Str::uuid()->toString(), 
            'name' => 'limbah_cair',
            'slug' => 'limbah-cair'
        ]);
        
        $kategoriOlahan = Category::create([
            'id' => Str::uuid()->toString(), 
            'name' => 'limbah_olahan',
            'slug' => 'limbah-olahan'
        ]);

        // 2. Seed Akun Demo Peternak (Seller)
        $userPeternak = User::create([
            'id'       => Str::uuid()->toString(),
            'name'     => 'Jonathan Peternak',
            'email'    => 'peternak@agrowwaste.com',
            'password' => Hash::make('password123'),
            'role'     => 'peternak',
            'phone'    => '081234567890',
        ]);

        PeternakProfile::create([
            'id'              => Str::uuid()->toString(),
            'user_id'         => $userPeternak->id,
            'nama_kandang' => 'Maju Jaya Organik Malang',
            'jenis_ternak'    => json_encode(['sapi', 'kambing']),
            'provinsi'        => 'Jawa Timur',
            'kabupaten'       => 'Kabupaten Malang',
            'kecamatan'       => 'Singosari',
            'lat'             => -7.892400,
            'lng'             => 112.656300,
            'badge'           => 'peternak_hijau',
            'total_sold_kg'   => 850.00,
        ]);

        // 3. Seed Akun Demo Pembeli (Buyer)
        $userPembeli = User::create([
            'id'       => Str::uuid()->toString(),
            'name'     => 'Budi Pembeli',
            'email'    => 'pembeli@agrowwaste.com',
            'password' => Hash::make('password123'),
            'role'     => 'pembeli',
            'phone'    => '089876543210',
        ]);

        BuyerProfile::create([
            'id'       => Str::uuid()->toString(),
            'user_id'  => $userPembeli->id,
            'provinsi' => 'Jawa Timur',
            'kabupaten'=> 'Kota Malang',
        ]);

        // 3.b Seed Akun Demo Admin
        User::create([
            'id'       => Str::uuid()->toString(),
            'name'     => 'Admin AgroWaste',
            'email'    => 'admin@agrowwaste.com',
            'password' => Hash::make('password123'),
            'role'     => 'admin',
        ]);

        // 3.c Seed Akun Demo Kurir (Logistik)
        $userKurir = User::create([
            'id'       => Str::uuid()->toString(),
            'name'     => 'Agus Kurir',
            'email'    => 'kurir@agrowwaste.com',
            'password' => Hash::make('password123'),
            'role'     => 'logistik',
            'phone'    => '081298765432',
        ]);

        $logistikProfile = \App\Models\LogistikProfile::create([
            'id'            => Str::uuid()->toString(),
            'user_id'       => $userKurir->id,
            'company_name'  => 'AgroWaste Express Malang',
            'vehicle_plate' => 'N 1234 AB',
        ]);

        // 4. Seed Contoh Produk Aktif Realistis
        $peternakProfile = $userPeternak->peternakProfile;

        $productPadat = Product::create([
            'id'                  => '147d1c5f-1150-4dcd-8630-3f3cf6fa60c7',
            'peternak_profile_id' => $peternakProfile->id,
            'category_id'         => $kategoriPadat->id,
            'name'                => 'Pupuk Kandang Sapi Kualitas Premium',
            'slug'                => 'pupuk-kandang-sapi-kualitas-premium',
            'description'         => 'Kotoran sapi murni yang telah melalui proses fermentasi matang, kering, dan tidak berbau. Siap pakai untuk lahan pertanian.',
            'jenis_ternak'        => 'sapi',
            'kondisi'             => 'Kering, sudah difermentasi',
            'price'               => 1500.00,
            'unit'                => 'kg',
            'stock_kg'            => 500.00,
            'min_order_kg'        => 50.00,
            'provinsi'            => 'Jawa Timur',
            'kabupaten'           => 'Kabupaten Malang',
            'kecamatan'           => 'Singosari',
            'status'              => 'aktif',
        ]);

        $productCair = Product::create([
            'id'                  => Str::uuid()->toString(),
            'peternak_profile_id' => $peternakProfile->id,
            'category_id'         => $kategoriCair->id,
            'name'                => 'Bio-Slurry Cair Organik Super',
            'slug'                => 'bio-slurry-cair-organik-super',
            'description'         => 'Limbah cair biogas kaya unsur hara makro dan mikro, sangat baik untuk pupuk daun dan tanaman sayur.',
            'jenis_ternak'        => 'sapi',
            'kondisi'             => 'Cair, hasil olahan instalasi biogas',
            'price'               => 2000.00,
            'unit'                => 'liter',
            'stock_kg'            => 300.00,
            'min_order_kg'        => 20.00,
            'provinsi'            => 'Jawa Timur',
            'kabupaten'           => 'Kabupaten Malang',
            'kecamatan'           => 'Singosari',
            'status'              => 'aktif',
        ]);

        // 5. Seed Realistis Pesanan & Pengiriman Kurir untuk Demo Peta GIS
        
        // Pesanan 1 (Status: dikirim / shipment: dalam_perjalanan)
        $order1 = Order::create([
            'id'                => Str::uuid()->toString(),
            'order_number'      => 'AW-90214',
            'user_id'           => $userPembeli->id,
            'peternak_id'       => $userPeternak->id,
            'metode_pengiriman' => 'Kargo Hijau',
            'metode_pembayaran' => 'Transfer Bank',
            'alamat_pengiriman' => 'Jl. Kawi No. 45, Klojen, Kota Malang, Jawa Timur 65116',
            'status'            => 'dikirim',
            'total_price'       => 375000.00,
            'quantity_kg'       => 250.00,
        ]);

        OrderItem::create([
            'id'           => Str::uuid()->toString(),
            'order_id'     => $order1->id,
            'product_id'   => $productPadat->id,
            'quantity_kg'  => 250,
            'price_per_kg' => 1500.00,
        ]);

        Shipment::create([
            'id'                  => Str::uuid()->toString(),
            'order_id'            => $order1->id,
            'logistik_profile_id' => $logistikProfile->id,
            'status'              => 'dalam_perjalanan',
            'tracking_notes'      => 'Kurir sedang memuat barang dari peternakan Jonathan.',
        ]);

        // Pesanan 2 (Status: dikonfirmasi / shipment: dijadwalkan)
        $order2 = Order::create([
            'id'                => Str::uuid()->toString(),
            'order_number'      => 'AW-90192',
            'user_id'           => $userPembeli->id,
            'peternak_id'       => $userPeternak->id,
            'metode_pengiriman' => 'Kargo Hijau',
            'metode_pembayaran' => 'Transfer Bank',
            'alamat_pengiriman' => 'Kec. Caringin, Kab. Bogor, Jawa Barat 16730',
            'status'            => 'dikonfirmasi',
            'total_price'       => 1000000.00,
            'quantity_kg'       => 500.00,
        ]);

        OrderItem::create([
            'id'           => Str::uuid()->toString(),
            'order_id'     => $order2->id,
            'product_id'   => $productCair->id,
            'quantity_kg'  => 500,
            'price_per_kg' => 2000.00,
        ]);

        Shipment::create([
            'id'                  => Str::uuid()->toString(),
            'order_id'            => $order2->id,
            'logistik_profile_id' => $logistikProfile->id,
            'status'              => 'dijadwalkan',
            'tracking_notes'      => 'Pengiriman dijadwalkan kurir.',
        ]);

        // Pesanan 3 (Status: selesai / shipment: terkirim)
        $order3 = Order::create([
            'id'                => Str::uuid()->toString(),
            'order_number'      => 'AW-89943',
            'user_id'           => $userPembeli->id,
            'peternak_id'       => $userPeternak->id,
            'metode_pengiriman' => 'Logistik Mandiri',
            'metode_pembayaran' => 'Transfer Bank',
            'alamat_pengiriman' => 'Lembang, Bandung, Jawa Barat 40391',
            'status'            => 'selesai',
            'total_price'       => 150000.00,
            'quantity_kg'       => 100.00,
        ]);

        OrderItem::create([
            'id'           => Str::uuid()->toString(),
            'order_id'     => $order3->id,
            'product_id'   => $productPadat->id,
            'quantity_kg'  => 100,
            'price_per_kg' => 1500.00,
        ]);

        Shipment::create([
            'id'                  => Str::uuid()->toString(),
            'order_id'            => $order3->id,
            'logistik_profile_id' => $logistikProfile->id,
            'status'              => 'terkirim',
            'tracking_notes'      => 'Diterima oleh Pak Budi di lokasi.',
        ]);
    }
}
