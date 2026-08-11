<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Str;

class ProductService
{
    /**
     * Generate slug unik dari nama produk.
     * Coba "nama-produk", lalu "nama-produk-2", "nama-produk-3", dst.
     * Menyertakan soft-deleted rows agar slug tidak dipakai ulang.
     */
    private function generateUniqueSlug(string $name, ?string $excludeId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $n    = 2;

        while (
            Product::withTrashed()
                ->where('slug', $slug)
                ->when($excludeId, fn($q) => $q->where('id', '!=', $excludeId))
                ->exists()
        ) {
            $slug = $base . '-' . $n++;
        }

        return $slug;
    }

    /**
     * Membuat produk limbah baru oleh Peternak
     */
    public function createProduct(array $data, User $user): Product
    {
        $peternak = $user->peternakProfile;

        if (!$peternak) {
            throw new \Exception('Profil peternak tidak ditemukan. Anda belum melengkapi profil.');
        }

        $data['peternak_profile_id'] = $peternak->id;
        $data['slug']                = $this->generateUniqueSlug($data['name']);
        $data['status']              = 'menunggu_review';

        // Lokasi produk dikunci ke lokasi peternak terdaftar
        $data['provinsi']  = $peternak->provinsi;
        $data['kabupaten'] = $peternak->kabupaten;
        $data['kecamatan'] = $peternak->kecamatan;

        return Product::create($data);
    }

    /**
     * Update produk oleh Peternak Pemilik.
     * Kalau name berubah, slug diregenerasi otomatis (unik, exclude produk ini sendiri).
     */
    public function updateProduct(Product $product, array $data): Product
    {
        if (isset($data['name']) && $data['name'] !== $product->name) {
            $data['slug'] = $this->generateUniqueSlug($data['name'], $product->id);
        }

        $product->update($data);
        return $product;
    }

    /**
     * Upload gambar produk menggunakan Spatie Media Library
     */
    public function uploadImages(\App\Models\Product $product, array $images): \App\Models\Product
    {
        $existingMediaCount = $product->getMedia('product_images')->count();
        
        // Validasi agar total tidak lebih dari 3
        if ($existingMediaCount + count($images) > 3) {
            throw new \Exception('Satu produk maksimal hanya boleh memiliki 3 gambar.');
        }

        foreach ($images as $image) {
            $product->addMedia($image)->toMediaCollection('product_images');
        }

        return $product;
    }

    /**
     * Update status produk (Khusus Admin)
     */
    public function updateStatus(\App\Models\Product $product, string $status, ?string $reason = null): \App\Models\Product
    {
        $product->update([
            'status' => $status,
            'rejection_reason' => $reason
        ]);
        return $product;
    }
}
