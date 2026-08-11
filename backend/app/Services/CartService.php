<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\CartItem;
use Illuminate\Support\Facades\Auth;

class CartService
{
    /**
     * Ambil semua isi keranjang milik user yang sedang login
     */
    public function getCart()
    {
        return CartItem::with(['product.peternakProfile'])->where('user_id', Auth::id())->get();
    }

    /**
     * Tambah produk ke keranjang. Jika sudah ada, tambahkan quantity-nya.
     */
    public function addToCart(array $data)
    {
        $cartItem = CartItem::where('user_id', Auth::id())
            ->where('product_id', $data['product_id'])
            ->first();

        if ($cartItem) {
            // Jika produk sudah ada di keranjang, akumulasikan beratnya
            $cartItem->quantity_kg += $data['quantity_kg'];
            $cartItem->save();
            
            return $cartItem;
        }

        // Jika belum ada, buat entri baru
        return CartItem::create([
            'user_id'     => Auth::id(),
            'product_id'  => $data['product_id'],
            'quantity_kg' => $data['quantity_kg'],
        ]);
    }

    /**
     * Update quantity produk tertentu di keranjang
     */
    public function updateQuantity(string $id, float $quantity)
    {
        $cartItem = CartItem::where('user_id', Auth::id())->findOrFail($id);
        $cartItem->update(['quantity_kg' => $quantity]);
        
        return $cartItem;
    }

    /**
     * Hapus satu item dari keranjang
     */
    public function remove(string $id): bool
    {
        $cartItem = CartItem::where('user_id', Auth::id())->findOrFail($id);
        return $cartItem->delete();
    }
}