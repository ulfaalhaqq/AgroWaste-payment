<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ImpactLog;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Mengambil data untuk Green Dashboard (Publik)
     */
    public function getImpactDashboard(): JsonResponse
    {
        // Cache data selama 5 menit (300 detik)
        $data = Cache::remember('impact_dashboard', 300, function () {
            $totalWaste = ImpactLog::sum('waste_managed_kg');
            $totalCo2   = ImpactLog::sum('co2eq_reduced_kg');

            // Kesetaraan pohon: 1 pohon tropis menyerap ~21 kg CO2/tahun (config/impact.php)
            $treeFactor      = config('impact.pohon_co2_per_tahun_kg', 21);
            $equivalentTrees = $totalCo2 > 0 ? (int) floor($totalCo2 / $treeFactor) : 0;

            // ── Distribusi limbah per jenis ternak ────────────────────────────
            // Sumber: order_items dari order berstatus 'selesai', join ke products.jenis_ternak.
            // Order lama (tanpa order_items) tidak ikut; jumlahnya kecil & tidak simpan jenis_ternak.
            $rawDistribution = DB::table('order_items')
                ->join('orders',   'order_items.order_id',   '=', 'orders.id')
                ->join('products', 'order_items.product_id', '=', 'products.id')
                ->where('orders.status', 'selesai')
                ->whereNotNull('products.jenis_ternak')
                ->where('products.jenis_ternak', '!=', '')
                ->select('products.jenis_ternak', DB::raw('SUM(order_items.quantity_kg) as total_kg'))
                ->groupBy('products.jenis_ternak')
                ->orderByDesc('total_kg')
                ->get();

            $grandTotal = $rawDistribution->sum('total_kg');

            $wasteDistribution = $rawDistribution->map(function ($row) use ($grandTotal) {
                return [
                    'jenis_ternak' => $row->jenis_ternak,
                    'total_kg'     => (float) $row->total_kg,
                    'percentage'   => $grandTotal > 0
                        ? round(($row->total_kg / $grandTotal) * 100, 1)
                        : 0,
                ];
            })->values()->all();

            return [
                'total_waste_managed_kg' => (float) $totalWaste,
                'total_co2eq_reduced_kg' => (float) $totalCo2,
                'equivalent_trees'       => $equivalentTrees,
                'active_sellers_count'   => User::where('role', 'peternak')->count(),
                'total_transactions'     => Order::where('status', 'selesai')->count(),
                'waste_distribution'     => $wasteDistribution,
            ];
        });
        
        return response()->json([
            'success' => true,
            'message' => 'Data Green Dashboard berhasil diambil.',
            'data'    => $data
        ], 200);
    }
}