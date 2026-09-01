<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;

Route::prefix('v1')->group(function () {
    
    // Auth Routes (Public)
    Route::prefix('auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/forgot-password', [\App\Http\Controllers\Auth\ForgotPasswordController::class, 'sendResetLink']);
        Route::post('/reset-password', [\App\Http\Controllers\Auth\ForgotPasswordController::class, 'resetPassword']);
    });

    // Katalog Produk & Kategori (Public - Bisa dilihat tanpa login)
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{id}', [ProductController::class, 'show']); // Detail produk
    Route::get('/products/{id}/reviews', [\App\Http\Controllers\Api\ReviewController::class, 'index']); // Ulasan produk
    Route::get('/categories', [\App\Http\Controllers\Api\CategoryController::class, 'index']);
    Route::get('/sellers/{id}', [ProductController::class, 'sellerProfile']);

    // Kontak Admin (Public - untuk redirect WA kurir)
    Route::get('/contact', function () {
        $admin = \App\Models\User::where('role', 'admin')->first();
        $phone = $admin?->phone ?? null;
        return response()->json([
            'success' => true,
            'data' => ['phone' => $phone]
        ]);
    });
   
    // Edukasi Artikel (Public)
    Route::get('/articles', [\App\Http\Controllers\Api\ArticleController::class, 'index']);
    Route::get('/articles/{slug}', [\App\Http\Controllers\Api\ArticleController::class, 'show']);

   // Protected Routes (Wajib bawa Token)
    Route::middleware('auth:sanctum')->group(function () {
        
        // Review Routes (Protected)
        Route::post('/reviews', [\App\Http\Controllers\Api\ReviewController::class, 'store']);
        Route::get('/products/{id}/can-review', [\App\Http\Controllers\Api\ReviewController::class, 'canReview']);

        // Product Routes (Hanya peternak yang bisa POST, PUT, DELETE)
        Route::prefix('products')->group(function () {
            Route::post('/', [ProductController::class, 'store']); // Create Produk
            Route::put('/{id}', [ProductController::class, 'update']); // Edit Produk
            Route::delete('/{id}', [ProductController::class, 'destroy']); // Hapus Produk

            // Upload Images
            Route::post('/{id}/images', [\App\Http\Controllers\Api\ProductController::class, 'uploadImages']);
            Route::delete('/{id}/images/{mediaId}', [\App\Http\Controllers\Api\ProductController::class, 'deleteImage']);
        });

        // Order Routes
        Route::prefix('orders')->group(function () {
            Route::post('/', [\App\Http\Controllers\Api\OrderController::class, 'store']); // Buat pesanan (Pembeli)
            Route::get('/', [\App\Http\Controllers\Api\OrderController::class, 'index']); // Riwayat pesanan
            Route::get('/{id}', [\App\Http\Controllers\Api\OrderController::class, 'show']); // Detail/lacak pesanan
            Route::put('/{id}/status', [\App\Http\Controllers\Api\OrderController::class, 'updateStatus']); // Ubah status pesanan
            Route::post('/checkout', [\App\Http\Controllers\Api\OrderController::class, 'checkout']); // Checkout

            Route::put('/{id}/process', [\App\Http\Controllers\Api\OrderController::class, 'processBySeller']); // Peternak memproses pesanan (terima/tolak)
            Route::put('/{id}/complete', [\App\Http\Controllers\Api\OrderController::class, 'completeByBuyer']);  // Pembeli mengonfirmasi barang diterima
        });

        // Cart Routes (Hanya untuk user yang sudah login)
        Route::prefix('cart-items')->group(function () {
            Route::get('/', [\App\Http\Controllers\Api\CartController::class, 'index']);
            Route::post('/', [\App\Http\Controllers\Api\CartController::class, 'store']);
            Route::put('/{id}', [\App\Http\Controllers\Api\CartController::class, 'update']);
            Route::delete('/{id}', [\App\Http\Controllers\Api\CartController::class, 'destroy']);
        });

        // Payment Routes (Butuh Login)
        Route::prefix('payments')->group(function () {
            Route::post('/manual', [\App\Http\Controllers\Api\PaymentController::class, 'uploadManualProof']);
            Route::post('/midtrans/token', [\App\Http\Controllers\Api\PaymentController::class, 'getSnapToken']);
        });

        // Admin Routes (Hanya Admin)
        Route::middleware('role:admin')->prefix('admin')->group(function () {
            Route::get('/products', [\App\Http\Controllers\Api\ProductController::class, 'adminIndex']);
            Route::put('/products/{id}/status', [\App\Http\Controllers\Api\ProductController::class, 'updateStatus']);
            Route::post('/articles', [\App\Http\Controllers\Api\ArticleController::class, 'store']); // Artikel Edukasi

            Route::get('/dashboard', [\App\Http\Controllers\Api\AdminController::class, 'dashboard']);
            Route::get('/users', [\App\Http\Controllers\Api\AdminController::class, 'usersIndex']);
            Route::put('/users/{id}/suspend', [\App\Http\Controllers\Api\AdminController::class, 'suspendUser']);
            Route::get('/shipments', [\App\Http\Controllers\Api\AdminController::class, 'getShipments']);
            Route::get('/couriers', [\App\Http\Controllers\Api\AdminController::class, 'getCouriers']);
            Route::post('/couriers', [\App\Http\Controllers\Api\AdminController::class, 'createCourier']);
            Route::post('/shipments/assign', [\App\Http\Controllers\Api\AdminController::class, 'assignCourier']);
            Route::get('/analytics', [\App\Http\Controllers\Api\AdminController::class, 'getAnalytics']);
        });

        // Notification Routes
        Route::prefix('notifications')->group(function () {
            Route::get('/', [\App\Http\Controllers\Api\NotificationController::class, 'index']);
            Route::put('/{id}/read', [\App\Http\Controllers\Api\NotificationController::class, 'markAsRead']);
        });

        // Profile Routes (Untuk semua role yang login)
        Route::prefix('profile')->group(function () {
            Route::get('/', [\App\Http\Controllers\Api\ProfileController::class, 'show']);
            Route::put('/', [\App\Http\Controllers\Api\ProfileController::class, 'update']);
            Route::post('/avatar', [\App\Http\Controllers\Api\ProfileController::class, 'uploadAvatar']);
            Route::delete('/avatar', [\App\Http\Controllers\Api\ProfileController::class, 'deleteAvatar']);
            Route::put('/password', [\App\Http\Controllers\Api\ProfileController::class, 'changePassword']); 
        });

        // Logistik Routes (Hanya Mitra Logistik)
        Route::middleware('role:logistik')->prefix('logistik')->group(function () {
            Route::get('/shipments', [\App\Http\Controllers\Api\ShipmentController::class, 'index']);
            Route::put('/shipments/{id}/status', [\App\Http\Controllers\Api\ShipmentController::class, 'updateStatus']);
        });

        // Seller Routes (Hanya Peternak)
        Route::middleware('role:peternak')->prefix('seller')->group(function () {
            Route::get('/dashboard', [\App\Http\Controllers\Api\SellerController::class, 'dashboard']);
            Route::get('/products', [\App\Http\Controllers\Api\SellerController::class, 'myProducts']);
        });
        
    });

    // Green Dashboard Route (Public)
    Route::get('/dashboard/impact', [\App\Http\Controllers\Api\DashboardController::class, 'getImpactDashboard']);

    // Webhook Midtrans Route (Public)
    Route::post('/webhooks/midtrans', [\App\Http\Controllers\Api\PaymentController::class, 'midtransWebhook']);
    
});