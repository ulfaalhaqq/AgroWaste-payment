<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('peternak_profile_id');
            $table->uuid('category_id');
            $table->string('name');
            $table->string('slug', 300)->unique();
            $table->text('description')->nullable();
            $table->string('jenis_ternak', 20);
            $table->string('kondisi', 100)->nullable();
            $table->decimal('price', 12, 2);
            $table->string('unit', 20)->default('kg');
            $table->decimal('stock_kg', 12, 2)->default(0);
            $table->decimal('min_order_kg', 12, 2)->default(1);
            $table->string('provinsi', 100);
            $table->string('kabupaten', 100);
            $table->string('kecamatan', 100);
            $table->string('status', 20)->default('pending');
            $table->text('rejection_reason')->nullable();
            $table->decimal('rating_avg', 3, 2)->default(0);
            $table->integer('review_count')->default(0);
            $table->decimal('total_sold', 12, 2)->default(0);
            $table->timestamps();
            $table->softDeletes(); // Wajib untuk fitur soft delete

            // Relasi
            $table->foreign('peternak_profile_id')->references('id')->on('peternak_profiles')->cascadeOnDelete();
            $table->foreign('category_id')->references('id')->on('categories')->restrictOnDelete();
            
            // Indexing untuk kecepatan pencarian
            $table->index(['status', 'deleted_at']);
            $table->index('jenis_ternak');
            $table->index('provinsi');
            $table->index('rating_avg');
            $table->index('price');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};