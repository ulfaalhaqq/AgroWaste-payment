<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SellerController extends Controller
{
    public function __construct(protected DashboardService $dashboardService) {}

    public function dashboard(): JsonResponse
    {
        $data = $this->dashboardService->getSellerStats();
        return response()->json(['success' => true, 'message' => 'Dashboard Peternak', 'data' => $data]);
    }

    /**
     * GET /seller/products
     * Mengembalikan semua produk milik peternak yang login (semua status).
     */
    public function myProducts(Request $request): JsonResponse
    {
        $peternak = $request->user()->peternakProfile;

        if (!$peternak) {
            return response()->json([
                'success' => false,
                'message' => 'Profil peternak tidak ditemukan.',
            ], 404);
        }

        $products = Product::with(['category', 'peternakProfile', 'media'])
            ->where('peternak_profile_id', $peternak->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $products,
        ]);
    }
}