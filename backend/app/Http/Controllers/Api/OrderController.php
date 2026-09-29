<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Requests\CheckoutRequest;
use App\Http\Controllers\Controller;
use App\Http\Requests\Order\StoreOrderRequest;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;

class OrderController extends Controller
{
    private OrderService $orderService;

    public function __construct(OrderService $orderService)
    {
        $this->orderService = $orderService;
    }

    public function store(StoreOrderRequest $request): JsonResponse
    {
        try {
            $order = $this->orderService->createOrder(
                $request->validated(), 
                $request->user()
            );

            return response()->json([
                'success' => true,
                'message' => 'Pesanan berhasil dibuat.',
                'data'    => $order
            ], 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat pesanan: ' . $e->getMessage(),
                'data'    => null
            ], 400); //  biasanya karena stok/min order
        }
    }

    /**
     * Menampilkan riwayat pesanan (Untuk Pembeli dan Peternak)
     */
    public function index(\Illuminate\Http\Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
            }

            $query = \App\Models\Order::with(['items.product', 'product', 'payment.proof', 'reviews', 'shipment']);

            if ($user->role === 'pembeli') {
                $query->where(function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                    if ($user->buyerProfile) {
                        $q->orWhere('buyer_profile_id', $user->buyerProfile->id);
                    }
                });
            } else if ($user->role === 'peternak') {
                $query->where(function ($q) use ($user) {
                    $q->where('peternak_id', $user->id);
                    if ($user->peternakProfile) {
                        $peternakProfileId = $user->peternakProfile->id;
                        $q->orWhereHas('product', function ($pq) use ($peternakProfileId) {
                            $pq->where('peternak_profile_id', $peternakProfileId);
                        });
                    }
                });
            } else {
                $query->where('user_id', $user->id);
            }

            $orders = $query->latest()->get();

            return response()->json(['success' => true, 'data' => $orders], 200);
        } catch (\Exception $e) {
            return response()->json(['success' => true, 'data' => []], 200);
        }
    }

    /**
     * Menampilkan detail pesanan tunggal (Untuk tracking / detail)
     */
    public function show($id): JsonResponse
    {
        try {
            $order = \App\Models\Order::with([
                'items.product',
                'product',
                'payment.proof',
                'reviews',
                'peternak.peternakProfile',
                'shipment.logistikProfile.user'
            ])->where('id', $id)->orWhere('order_number', $id)->first();

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pesanan tidak ditemukan.'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data'    => $order
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil detail pesanan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * [DINONAKTIFKAN] Dulu dipakai untuk mengubah status pesanan secara
     * langsung, TAPI endpoint ini tidak pernah memvalidasi:
     *   - siapa yang boleh memanggilnya (tidak dibatasi role peternak,
     *     siapapun yang login bisa memakainya)
     *   - apakah pemanggil adalah pemilik/pihak terkait order ini
     *   - transisi status yang valid (bisa lompat langsung ke "selesai"
     *     tanpa melalui "dikonfirmasi"/"dikirim")
     *   - efek samping bisnis (kredit wallet peternak/kurir tidak pernah
     *     ikut terpicu, karena logicnya cuma ada di OrderService, method
     *     ini update kolom status secara langsung tanpa lewat situ)
     *
     * Akibatnya order bisa "diselesaikan" secara status tanpa uang
     * pernah benar-benar dikreditkan ke siapapun, dan siapapun yang
     * login bisa melakukannya ke order milik orang lain.
     *
     * Gunakan PUT /orders/{id}/process (peternak Terima/Tolak) dan
     * PUT /orders/{id}/complete (pembeli konfirmasi terima) sebagai
     * gantinya — keduanya sudah melalui OrderService dengan validasi
     * transisi status dan efek samping wallet yang benar.
     */
    public function updateStatus(\Illuminate\Http\Request $request, $id): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Endpoint ini sudah tidak digunakan. Gunakan /orders/{id}/process atau /orders/{id}/complete.',
        ], 410); // 410 Gone
    }

    public function checkout(CheckoutRequest $request): \Illuminate\Http\JsonResponse
    {
        try {
            $order = $this->orderService->checkout($request->validated());

            return response()->json([
                'success' => true,
                'message' => 'Checkout berhasil. Pesanan telah dibuat.',
                'data'    => $order
            ], 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Checkout gagal: ' . $e->getMessage(),
                'data'    => null
            ], 400);
        }
    }

    public function processBySeller(\Illuminate\Http\Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:dikonfirmasi,ditolak',
            'rejection_reason' => 'required_if:status,ditolak|string|nullable'
        ]);

        try {
            $order = $this->orderService->processOrderBySeller($id, $request->status, $request->rejection_reason);
            return response()->json(['success' => true, 'message' => 'Pesanan berhasil diproses.', 'data' => $order]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function completeByBuyer($id)
    {
        try {
            $order = $this->orderService->completeOrder($id);
            return response()->json(['success' => true, 'message' => 'Pesanan selesai. Terima kasih!', 'data' => $order]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}