<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use App\Models\User;
use App\Models\Order;
use App\Models\LogistikProfile;
use App\Models\Shipment;
use App\Models\ImpactLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function __construct(protected DashboardService $dashboardService) {}

    public function dashboard(): JsonResponse
    {
        $data = $this->dashboardService->getAdminStats();
        return response()->json(['success' => true, 'message' => 'Dashboard Admin', 'data' => $data]);
    }

    /**
     * Menampilkan semua user platform AgroWaste
     */
    public function usersIndex(): JsonResponse
    {
        $users = User::with(['peternakProfile', 'buyerProfile'])
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json(['success' => true, 'data' => $users], 200);
    }

    // Fitur Suspend Akun
    public function suspendUser(string $id): JsonResponse
    {
        $user = User::findOrFail($id);
        
        // Toggle status suspend
        $user->update(['is_suspended' => !$user->is_suspended]);
        
        $statusStr = $user->is_suspended ? 'ditangguhkan' : 'diaktifkan kembali';
        return response()->json(['success' => true, 'message' => "Akun {$user->name} berhasil {$statusStr}.", 'data' => $user]);
    }

    /**
     * Mendapatkan semua pesanan untuk logistik admin
     */
    public function getShipments(): JsonResponse
    {
        // 1. Otomatis tugaskan kurir terdekat untuk pesanan logistik yang belum punya kurir
        $logistikOrders = Order::with(['peternak.peternakProfile'])
            ->where('metode_pengiriman', 'logistik')
            ->whereIn('status', ['dikonfirmasi', 'dikirim', 'selesai'])
            ->get();

        foreach ($logistikOrders as $ord) {
            $shipment = Shipment::where('order_id', $ord->id)->first();
            if (!$shipment) {
                $closestCourier = \App\Services\ShipmentService::findClosestCourierForOrder($ord);
                if ($closestCourier) {
                    Shipment::create([
                        'id'                  => \Illuminate\Support\Str::uuid()->toString(),
                        'order_id'            => $ord->id,
                        'logistik_profile_id' => $closestCourier->id,
                        'status'              => 'dijadwalkan',
                    ]);
                    if ($ord->status === 'dikonfirmasi') {
                        $ord->update(['status' => 'dikirim']);
                    }
                }
            } else if (!$shipment->logistik_profile_id) {
                $closestCourier = \App\Services\ShipmentService::findClosestCourierForOrder($ord);
                if ($closestCourier) {
                    $shipment->update([
                        'logistik_profile_id' => $closestCourier->id,
                        'status'              => 'dijadwalkan',
                    ]);
                    if ($ord->status === 'dikonfirmasi') {
                        $ord->update(['status' => 'dikirim']);
                    }
                }
            }
        }

        // Ambil order beserta shipment, user (buyer), peternak, dan detail items
        $orders = Order::with(['user', 'peternak.peternakProfile', 'items.product'])
            ->orderBy('created_at', 'desc')
            ->get();

        // Ambil penugasan logistik
        $shipments = Shipment::with(['logistikProfile.user'])->get();

        return response()->json([
            'success' => true,
            'data' => [
                'orders' => $orders,
                'shipments' => $shipments
            ]
        ]);
    }

    /**
     * Mendapatkan semua profil kurir logistik
     */
    public function getCouriers(): JsonResponse
    {
        $couriers = LogistikProfile::with('user')->get();
        return response()->json([
            'success' => true,
            'data' => $couriers
        ]);
    }

    /**
     * Menugaskan kurir ke order tertentu
     */
    public function assignCourier(Request $request): JsonResponse
    {
        $request->validate([
            'order_id' => 'required|exists:orders,id',
            'logistik_profile_id' => 'required|exists:logistik_profiles,id',
        ]);

        $shipment = Shipment::where('order_id', $request->order_id)->first();
        if ($shipment) {
            $shipment->update([
                'logistik_profile_id' => $request->logistik_profile_id,
                'status' => 'dijadwalkan',
            ]);
        } else {
            $shipment = Shipment::create([
                'id' => \Illuminate\Support\Str::uuid()->toString(),
                'order_id' => $request->order_id,
                'logistik_profile_id' => $request->logistik_profile_id,
                'status' => 'dijadwalkan',
            ]);
        }

        // Update status order menjadi 'dikirim'
        $order = Order::findOrFail($request->order_id);
        $order->update(['status' => 'dikirim']);

        // Kirim Notifikasi ke Buyer
        app(\App\Services\NotificationService::class)->send(
            $order->user_id,
            'PENGIRIMAN_DITUGASKAN',
            'Kurir Ditugaskan',
            "Kurir telah ditugaskan untuk menjemput pesanan {$order->order_number}."
        );

        // Kirim Notifikasi ke Kurir
        $courier = LogistikProfile::findOrFail($request->logistik_profile_id);
        app(\App\Services\NotificationService::class)->send(
            $courier->user_id,
            'TUGAS_PENGIRIMAN_BARU',
            'Tugas Pengiriman Baru',
            "Tugas pengiriman baru untuk pesanan {$order->order_number}."
        );

        return response()->json([
            'success' => true,
            'message' => 'Kurir berhasil ditugaskan.',
            'data' => $shipment->load('logistikProfile.user')
        ]);
    }

    /**
     * Mendapatkan data analitik dampak lingkungan untuk admin
     */
    public function getAnalytics(): JsonResponse
    {
        $totalWaste = (float) ImpactLog::sum('waste_managed_kg');
        $totalCo2 = (float) ImpactLog::sum('co2eq_reduced_kg');
        $activeSellers = User::where('role', 'peternak')->count();

        // Distribusi limbah berdasarkan 3 kategori utama
        $allCategories = DB::table('categories')->get();
        $soldDist = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->join('categories', 'products.category_id', '=', 'categories.id')
            ->whereIn('orders.status', ['dikonfirmasi', 'dikirim', 'selesai'])
            ->select('categories.id', 'categories.name as category_name', DB::raw('SUM(order_items.quantity_kg) as total'))
            ->groupBy('categories.id', 'categories.name')
            ->get()
            ->keyBy('category_name');

        $categoryDist = $allCategories->map(function ($cat) use ($soldDist) {
            $found = $soldDist->get($cat->name);
            return [
                'category_name' => $cat->name,
                'total' => $found ? (float)$found->total : 0,
            ];
        })->values();

        // Distribusi regional (Jawa Barat, Jawa Tengah, Jawa Timur, dll)
        $regionalDist = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->where('orders.status', 'selesai')
            ->select('products.provinsi', DB::raw('SUM(order_items.quantity_kg) as total'))
            ->groupBy('products.provinsi')
            ->orderBy('total', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'total_waste_managed_kg' => $totalWaste,
                'total_co2eq_reduced_kg' => $totalCo2,
                'active_sellers_count'   => $activeSellers,
                'category_distribution'  => $categoryDist,
                'regional_distribution'  => $regionalDist,
            ]
        ]);
    }

    /**
     * Membuat akun kurir baru khusus oleh Admin
     */
    public function createCourier(Request $request): JsonResponse
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|string|email|max:255|unique:users,email',
            'phone'    => 'nullable|string|max:20',
            'password' => 'required|string|min:8',
        ]);

        $authService = app(\App\Services\AuthService::class);
        $user = $authService->registerUser([
            'name'     => $request->name,
            'email'    => $request->email,
            'phone'    => $request->phone,
            'password' => $request->password,
            'role'     => 'logistik',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Akun kurir berhasil dibuat.',
            'data'    => $user->load('logistikProfile'),
        ], 201);
    }
}