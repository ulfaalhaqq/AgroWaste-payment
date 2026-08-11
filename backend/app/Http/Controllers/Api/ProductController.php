<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\StoreProductRequest;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use App\Http\Requests\UploadProductImageRequest;
use App\Http\Requests\UpdateProductStatusRequest;
use App\Models\Product;


class ProductController extends Controller
{
    private ProductService $productService;

    public function __construct(ProductService $productService)
    {
        $this->productService = $productService;
    }

    /**
     * Menampilkan katalog produk dengan fitur Filter, Search, dan Sorting
     */
    public function index(\Illuminate\Http\Request $request): \Illuminate\Http\JsonResponse
    {
        // Mulai query, pastikan hanya mengambil produk yang statusnya 'aktif'
        $query = \App\Models\Product::with(['peternakProfile.user', 'category', 'media'])
            ->where('status', 'aktif');

        // 1. Fitur Search (Berdasarkan nama produk)
        if ($request->has('search') && $request->search !== '') {
            $query->where('name', 'ilike', '%' . $request->search . '%')
                  ->orWhere('description', 'ilike', '%' . $request->search . '%');
        }

        // 2. Fitur Filter Kategori
        if ($request->has('kategori') && $request->kategori !== '') {
            $kat = $request->kategori;
            $query->whereHas('category', function($q) use ($kat) {
                $q->where('name', $kat)
                  ->orWhere('slug', $kat)
                  ->orWhere('slug', \Illuminate\Support\Str::slug($kat));
            });
        }

        // 3. Fitur Filter Provinsi (Dari profil peternak)
        if ($request->has('provinsi') && $request->provinsi !== '') {
            $query->whereHas('peternakProfile', function($q) use ($request) {
                $q->where('provinsi', 'ilike', '%' . $request->provinsi . '%');
            });
        }

        // 4. Fitur Filter Jenis Ternak
        if ($request->has('jenis_ternak') && $request->jenis_ternak !== '') {
            $query->where('jenis_ternak', $request->jenis_ternak);
        }

        // 5. Fitur Sorting (Terbaru / Harga)
        $sort = $request->get('sort', 'terbaru');
        if ($sort === 'harga_terendah') {
            $query->orderBy('price', 'asc');
        } elseif ($sort === 'harga_tertinggi') {
            $query->orderBy('price', 'desc');
        } else {
            // Default: terbaru
            $query->orderBy('created_at', 'desc');
        }

        // 6. Pagination (12 produk per halaman agar pas 3 kolom per baris)
        $products = $query->paginate(12);

        return response()->json([
            'success' => true,
            'message' => 'Katalog produk berhasil diambil.',
            'data'    => $products
        ], 200);
    }
 

    public function store(StoreProductRequest $request): JsonResponse
    {
        try {
            $product = $this->productService->createProduct(
                $request->validated(), 
                $request->user() 
            );

            return response()->json([
                'success' => true,
                'message' => 'Produk berhasil didaftarkan dan menunggu persetujuan admin.',
                'data'    => $product->load(['category', 'peternakProfile', 'media']),
            ], 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan produk: ' . $e->getMessage(),
                'data'    => null
            ], 500);
        }
    }

    /**
     * Menampilkan detail satu produk (Public)
     */
    public function show($id): JsonResponse
    {
        $product = \App\Models\Product::with(['category', 'peternakProfile.user', 'media'])->find($id);

        if (!$product) {
            return response()->json(['success' => false, 'message' => 'Produk tidak ditemukan.'], 404);
        }

        return response()->json(['success' => true, 'data' => $product], 200);
    }

    /**
     * Mengubah data produk (Hanya Peternak Pemilik)
     */
    public function update(\Illuminate\Http\Request $request, $id): JsonResponse
    {
        $product = \App\Models\Product::find($id);

        if (!$product) {
            return response()->json(['success' => false, 'message' => 'Produk tidak ditemukan.'], 404);
        }

        if ($product->peternak_profile_id !== $request->user()->peternakProfile->id) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak. Anda bukan pemilik produk ini.'], 403);
        }

        $product = $this->productService->updateProduct($product, $request->all());

        return response()->json(['success' => true, 'message' => 'Produk berhasil diubah.', 'data' => $product->load('media')], 200);
    }

    /**
     * Menghapus produk (Soft Delete)
     */
    public function destroy(\Illuminate\Http\Request $request, $id): JsonResponse
    {
        $product = \App\Models\Product::find($id);

        if (!$product) {
            return response()->json(['success' => false, 'message' => 'Produk tidak ditemukan.'], 404);
        }

        if ($product->peternak_profile_id !== $request->user()->peternakProfile->id) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak. Anda bukan pemilik produk ini.'], 403);
        }

        $product->delete(); 

        return response()->json(['success' => true, 'message' => 'Produk berhasil dihapus.'], 200);
    }

    /**
     * Endpoint untuk Peternak mengunggah gambar produk (Maks 3)
     */
    public function uploadImages(UploadProductImageRequest $request, string $id): JsonResponse
    {
        $product = Product::findOrFail($id);

        if ($product->peternakProfile->user_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        try {
            $product = $this->productService->uploadImages($product, $request->file('images'));
            
            return response()->json([
                'success' => true,
                'message' => 'Gambar produk berhasil diunggah.',
                'data'    => $product->load('media') 
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data'    => null
            ], 400);
        }
    }

    /**
     * Endpoint untuk Peternak menghapus gambar produk tertentu
     */
    public function deleteImage(\Illuminate\Http\Request $request, string $id, string $mediaId): JsonResponse
    {
        $product = Product::findOrFail($id);

        if ($product->peternakProfile->user_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $media = $product->getMedia('product_images')->where('id', $mediaId)->first();

        if (!$media) {
            return response()->json(['success' => false, 'message' => 'Gambar tidak ditemukan.'], 404);
        }

        $media->delete();

        return response()->json([
            'success' => true,
            'message' => 'Gambar produk berhasil dihapus.',
            'data'    => $product->load('media')
        ], 200);
    }

    /**
     * Menampilkan semua produk untuk Admin
     */
    public function adminIndex(\Illuminate\Http\Request $request): JsonResponse
    {
        $products = Product::with(['category', 'peternakProfile.user', 'media'])
            ->orderBy('created_at', 'desc')
            ->get();

        $pendingCount = Product::where('status', 'menunggu_review')->count();
        $approvedToday = Product::where('status', 'aktif')
            ->whereDate('updated_at', \Carbon\Carbon::today())
            ->count();
        $rejectedWeekly = Product::where('status', 'ditolak')
            ->where('updated_at', '>=', \Carbon\Carbon::now()->subDays(7))
            ->count();

        return response()->json([
            'success' => true,
            'data'    => $products,
            'meta'    => [
                'pending_count' => $pendingCount,
                'approved_today' => $approvedToday,
                'rejected_weekly' => $rejectedWeekly,
            ]
        ], 200);
    }

    /**
     * Endpoint untuk Admin menyetujui / menolak produk
     */
    public function updateStatus(UpdateProductStatusRequest $request, string $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        
        $product = $this->productService->updateStatus(
            $product, 
            $request->validated('status'),
            $request->validated('rejection_reason')
        );

        return response()->json([
            'success' => true,
            'message' => 'Status produk berhasil diperbarui menjadi ' . $product->status,
            'data'    => $product
        ], 200);
    }

    /**
     * Menampilkan profil peternak beserta produk-produk aktifnya (Public)
     */
    public function sellerProfile(string $id): JsonResponse
    {
        $user = \App\Models\User::with('peternakProfile')->find($id);

        if (!$user || $user->role !== 'peternak' || !$user->peternakProfile) {
            $peternakProfile = \App\Models\PeternakProfile::with('user')->find($id);
            if ($peternakProfile && $peternakProfile->user) {
                $user = $peternakProfile->user;
                $user->setRelation('peternakProfile', $peternakProfile);
            }
        }

        if (!$user || !$user->peternakProfile) {
            return response()->json([
                'success' => false,
                'message' => 'Profil peternak tidak ditemukan.'
            ], 404);
        }

        $products = \App\Models\Product::with(['category', 'media'])
            ->where('peternak_profile_id', $user->peternakProfile->id)
            ->where('status', 'aktif')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'avatar_url' => $user->avatar_url,
                ],
                'profile' => $user->peternakProfile,
                'products' => $products
            ]
        ], 200);
    }
}