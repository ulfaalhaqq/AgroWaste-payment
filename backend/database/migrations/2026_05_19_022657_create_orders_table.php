<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->uuid('id')->primary(); // Pakai UUID
            
            // Relasi ke pembeli dan produk
            $table->uuid('buyer_profile_id');
            $table->uuid('product_id');

            // Detail pesanan
            $table->decimal('quantity_kg', 10, 2);
            $table->decimal('total_price', 15, 2);
            $table->text('delivery_address');
            $table->string('status')->default('pending'); // pending, dikonfirmasi, dikirim, selesai, dibatalkan
            
            $table->timestamps();

            // Foreign keys
            $table->foreign('buyer_profile_id')->references('id')->on('buyer_profiles')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
