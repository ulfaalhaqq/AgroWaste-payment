<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class PublicConfigController extends Controller
{
    /**
     * Informasi rekening admin AgroWaste untuk transfer manual & setoran COD.
     * Endpoint publik (tidak perlu login) karena dibutuhkan di halaman
     * checkout sebelum pembeli login sekalipun bisa jadi relevan.
     */
    public function adminBankAccount(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => config('agrowaste.admin_bank'),
        ]);
    }
}