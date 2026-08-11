<?php

namespace Database\Seeders;

use App\Models\ImpactLog;
use App\Models\Order;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * Backfill ImpactLog untuk order yang sudah berstatus 'selesai'
 * sebelum bug isDirty/fillable diperbaiki.
 *
 * Jalankan sekali:
 *   php artisan db:seed --class=BackfillImpactLogSeeder
 */
class BackfillImpactLogSeeder extends Seeder
{
    public function run(): void
    {
        $co2Factor = config('impact.co2_factors.sapi', 0.98);

        // Ambil semua order selesai yang belum punya ImpactLog
        $alreadyLogged = ImpactLog::pluck('order_id')->all();

        $orders = Order::with('items')
            ->where('status', 'selesai')
            ->whereNotIn('id', $alreadyLogged)
            ->get();

        if ($orders->isEmpty()) {
            $this->command->info('Tidak ada order selesai yang perlu di-backfill.');
            return;
        }

        $created = 0;
        $skipped = 0;

        foreach ($orders as $order) {
            // Hitung total kg dari OrderItems (alur checkout baru)
            $totalKg = $order->items->sum('quantity_kg');

            // Fallback ke kolom quantity_kg di tabel orders (alur createOrder lama)
            if ($totalKg <= 0 && $order->quantity_kg > 0) {
                $totalKg = (float) $order->quantity_kg;
            }

            if ($totalKg <= 0) {
                $this->command->warn("Order {$order->order_number} ({$order->id}): quantity_kg = 0, dilewati.");
                $skipped++;
                continue;
            }

            ImpactLog::create([
                'id'               => Str::uuid()->toString(),
                'order_id'         => $order->id,
                'waste_managed_kg' => $totalKg,
                'co2eq_reduced_kg' => $totalKg * $co2Factor,
            ]);

            $this->command->info("  ✓ {$order->order_number}: {$totalKg} kg → " . round($totalKg * $co2Factor, 2) . ' kg CO2e');
            $created++;
        }

        // Hapus cache dashboard agar data langsung fresh
        Cache::forget('impact_dashboard');

        $this->command->info("Backfill selesai: {$created} ImpactLog dibuat, {$skipped} dilewati.");
        $this->command->info('Cache impact_dashboard sudah dihapus.');
    }
}
