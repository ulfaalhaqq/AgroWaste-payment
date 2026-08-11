<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCartItemRequest;
use App\Http\Requests\UpdateCartItemRequest;
use App\Services\CartService;
use Illuminate\Http\JsonResponse;

class CartController extends Controller
{
    public function __construct(protected CartService $cartService) {}

    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Data keranjang berhasil diambil.',
            'data'    => $this->cartService->getCart()
        ], 200);
    }

    public function store(StoreCartItemRequest $request): JsonResponse
    {
        $cartItem = $this->cartService->addToCart($request->validated());
        
        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil ditambahkan ke keranjang.',
            'data'    => $cartItem
        ], 201);
    }

    public function update(UpdateCartItemRequest $request, string $id): JsonResponse
    {
        $cartItem = $this->cartService->updateQuantity($id, (float) $request->validated('quantity_kg'));
        
        return response()->json([
            'success' => true,
            'message' => 'Kuantitas keranjang berhasil diupdate.',
            'data'    => $cartItem
        ], 200);
    }

    public function destroy(string $id): JsonResponse
    {
        $this->cartService->remove($id);
        
        return response()->json([
            'success' => true,
            'message' => 'Item berhasil dihapus dari keranjang.',
            'data'    => null
        ], 200);
    }
}