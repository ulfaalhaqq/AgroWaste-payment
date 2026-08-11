<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\{User, Product, Order, ImpactLog};
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardService
{
    public function getAdminStats(): array
    {
        // KPI Global untuk Admin
        return [
            'total_users'        => User::count(),
            'total_peternak'     => User::where('role', 'peternak')->count(),
            'total_pembeli'      => User::where('role', 'pembeli')->count(),
            'total_produk_aktif' => Product::where('status', 'aktif')->count(),
            'total_transaksi'    => Order::count(),
            'total_limbah_kg'    => ImpactLog::sum('waste_managed_kg'),
            'total_co2_saved'    => ImpactLog::sum('co2eq_reduced_kg'),
            'total_pendapatan'   => Order::where('status', 'selesai')->sum('total_price'),
            
            // Grafik transaksi 7 hari terakhir
            'chart_data' => Order::select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as total'))
                ->where('created_at', '>=', Carbon::now()->subDays(7))
                ->groupBy('date')
                ->orderBy('date', 'ASC')
                ->get(),
            
            // Aktivitas terbaru di platform
            'recent_activities' => (function() {
                $recentProducts = Product::with('peternakProfile')->orderBy('created_at', 'desc')->take(5)->get();
                $recentOrders = Order::with(['user', 'peternak'])->orderBy('created_at', 'desc')->take(5)->get();
                
                $activities = [];
                foreach ($recentProducts as $p) {
                    $activities[] = [
                        'id' => $p->id,
                        'type' => 'product',
                        'title' => $p->name,
                        'user' => $p->peternakProfile->nama_peternakan ?? 'Peternak',
                        'description' => 'mengunggah listing: ' . $p->name,
                        'created_at' => $p->created_at->toIso8601String(),
                    ];
                }
                foreach ($recentOrders as $o) {
                    $activities[] = [
                        'id' => $o->id,
                        'type' => 'order',
                        'title' => $o->order_number ?? ("Order #" . substr($o->id, 0, 8)),
                        'user' => $o->user->name ?? 'Pembeli',
                        'description' => $o->status === 'selesai' ? 'telah diselesaikan.' : 'melakukan checkout pesanan baru.',
                        'created_at' => $o->created_at->toIso8601String(),
                    ];
                }
                usort($activities, function ($a, $b) {
                    return strcmp($b['created_at'], $a['created_at']);
                });
                return array_slice($activities, 0, 5);
            })()
        ];
    }

    public function getSellerStats(): array
    {
        $user = Auth::user();
        $profileId = $user->peternakProfile->id; // untuk products (peternak_profile_id)
        $userId    = $user->id;                  // untuk orders (peternak_id = user_id peternak)

        // KPI Card Peternak
        return [
            'total_produk'     => Product::where('peternak_profile_id', $profileId)->count(),
            'pesanan_baru'     => Order::where('peternak_id', $userId)->where('status', 'menunggu_pembayaran')->count(),
            'total_terjual_kg' => $user->peternakProfile->total_sold_kg,
            'total_pendapatan' => Order::where('peternak_id', $userId)->where('status', 'selesai')->sum('total_price'),

            // Grafik penjualan 7 hari terakhir
            'chart_data' => Order::where('peternak_id', $userId)
                ->select(DB::raw('DATE(created_at) as date'), DB::raw('sum(total_price) as revenue'))
                ->where('created_at', '>=', Carbon::now()->subDays(7))
                ->groupBy('date')
                ->orderBy('date', 'ASC')
                ->get()
        ];
    }
}