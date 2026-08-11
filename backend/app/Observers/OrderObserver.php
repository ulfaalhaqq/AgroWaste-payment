<?php

namespace App\Observers;

use App\Models\Order;
use App\Models\ImpactLog;
use Illuminate\Support\Str;

class OrderObserver
{
    public function updated(Order $order): void
    {
        if ($order->wasChanged('status') && $order->status === 'selesai') {
            
            // Ensure relation 'items' (with products and peternakProfiles) is loaded
            $order->load(['items.product.peternakProfile']);
            
            // 1. Hitung total Kg dari relasi items 
            $totalKg = $order->items->sum('quantity_kg'); 
            
            // 2. Kalkulasi CO2eq menggunakan faktor dari config/impact.php
            $factors  = config('impact.co2_factors', []);
            $co2Saved = 0;

            foreach ($order->items as $item) {
                $factor    = $factors['sapi'] ?? 0.98; // default sapi; faktor per kg limbah (IPCC)
                $co2Saved += $item->quantity_kg * $factor;
            }

            // Fallback jika order menggunakan alur lama (tanpa OrderItems)
            if ($co2Saved === 0 && $order->quantity_kg > 0) {
                $co2Saved = $order->quantity_kg * ($factors['sapi'] ?? 0.98);
                $totalKg  = $order->quantity_kg;
            }

            // 3. Catat di ImpactLog agar muncul di Green Dashboard
            ImpactLog::create([
                'id'          => Str::uuid()->toString(),
                'order_id'    => $order->id,
                'waste_managed_kg'   => $totalKg,
                'co2eq_reduced_kg' => $co2Saved,
            ]);

            // 4. Update total penjualan dan Badge Peternak
            $firstItem = $order->items->first();
            
            if ($firstItem && $firstItem->product && $firstItem->product->peternakProfile) {
                $peternakProfile = $firstItem->product->peternakProfile;
                $peternakProfile->total_sold_kg += $totalKg;

                // Sistem Gamifikasi
                $badge = 'none';
                if ($peternakProfile->total_sold_kg >= 1000) {
                    $badge = 'pahlawan_bumi';
                } elseif ($peternakProfile->total_sold_kg >= 500) {
                    $badge = 'agen_iklim';
                } elseif ($peternakProfile->total_sold_kg >= 100) {
                    $badge = 'peternak_hijau';
                }

                $peternakProfile->badge = $badge;
                $peternakProfile->save();
            }
        }
    }
}