<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    /**
     * Get reviews for a specific product
     */
    public function index(string $productId): JsonResponse
    {
        $reviews = Review::with('user')
            ->where('product_id', $productId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $reviews,
        ], 200);
    }

    /**
     * Submit a review for a product (Only for buyers who completed an order)
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'order_id'   => 'nullable|exists:orders,id',
            'rating'     => 'required|integer|min:1|max:5',
            'comment'    => 'nullable|string|max:1000',
        ]);

        $user = $request->user();
        $productId = $request->input('product_id');
        $orderId   = $request->input('order_id');

        // Check if buyer has completed/received an order with this product
        $orderQuery = Order::where('user_id', $user->id)
            ->whereIn('status', ['selesai', 'diterima', 'pesanan_diterima', 'dikirim'])
            ->whereHas('items', function ($q) use ($productId) {
                $q->where('product_id', $productId);
            });

        if ($orderId) {
            $orderQuery->where('id', $orderId);
        }

        $completedOrder = $orderQuery->first();

        if (!$completedOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Anda hanya dapat memberikan ulasan untuk produk yang pesanan-nya telah selesai/diterima.',
            ], 403);
        }

        // Check if user already reviewed this product for this order
        $existingReview = Review::where('user_id', $user->id)
            ->where('product_id', $productId)
            ->when($orderId, fn($q) => $q->where('order_id', $orderId))
            ->first();

        if ($existingReview) {
            return response()->json([
                'success' => false,
                'message' => 'Anda telah memberikan ulasan untuk transaksi pesanan ini.',
            ], 400);
        }

        $review = Review::create([
            'user_id'    => $user->id,
            'product_id' => $productId,
            'order_id'   => $completedOrder->id,
            'rating'     => $request->input('rating'),
            'comment'    => $request->input('comment'),
        ]);

        // Recalculate product rating_avg and review_count
        $product = Product::find($productId);
        if ($product) {
            $avg = Review::where('product_id', $productId)->avg('rating') ?? 0;
            $count = Review::where('product_id', $productId)->count();

            $product->rating_avg = round((float)$avg, 1);
            $product->review_count = $count;
            $product->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Ulasan berhasil disimpan! Terima kasih atas masukan Anda.',
            'data'    => $review->load('user'),
        ], 201);
    }

    /**
     * Check if authenticated user can review a product (1 review per completed order)
     */
    public function canReview(Request $request, string $productId): JsonResponse
    {
        $user = $request->user();

        // Get all completed order IDs for this user & product
        $completedOrderIds = Order::where('user_id', $user->id)
            ->whereIn('status', ['selesai', 'diterima', 'pesanan_diterima'])
            ->whereHas('items', function ($q) use ($productId) {
                $q->where('product_id', $productId);
            })
            ->pluck('id');

        if ($completedOrderIds->isEmpty()) {
            return response()->json([
                'success'      => true,
                'can_review'   => false,
                'has_reviewed' => false,
                'order_id'     => null,
            ], 200);
        }

        // Get order IDs that have ALREADY been reviewed
        $reviewedOrderIds = Review::where('user_id', $user->id)
            ->where('product_id', $productId)
            ->whereIn('order_id', $completedOrderIds)
            ->pluck('order_id');

        // Find an order that hasn't been reviewed yet
        $unreviewedOrderId = $completedOrderIds->diff($reviewedOrderIds)->first();

        return response()->json([
            'success'      => true,
            'can_review'   => (bool) $unreviewedOrderId,
            'has_reviewed' => $reviewedOrderIds->isNotEmpty(),
            'order_id'     => $unreviewedOrderId,
        ], 200);
    }
}
