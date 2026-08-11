<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shipments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignUuid('logistik_profile_id')->constrained('logistik_profiles')->cascadeOnDelete();
            $table->string('status')->default('dijadwalkan'); // Status alur pengiriman
            $table->text('tracking_notes')->nullable(); // Catatan tambahan dari kurir
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shipments');
    }
};