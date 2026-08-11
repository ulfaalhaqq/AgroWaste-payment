<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // ── Kolom lama yang perlu jadi nullable ───────────────────────────
            // checkout() tidak mengisi kolom-kolom ini (dipakai oleh createOrder() saja)
            $table->uuid('buyer_profile_id')->nullable()->change();
            $table->uuid('product_id')->nullable()->change();
            $table->text('delivery_address')->nullable()->change();

            // ── Kolom baru untuk alur checkout() ─────────────────────────────
            $table->string('order_number')->unique()->nullable()->after('id');
            $table->uuid('user_id')->nullable()->after('order_number');
            $table->uuid('peternak_id')->nullable()->after('user_id');
            $table->string('metode_pengiriman')->nullable()->after('delivery_address');
            $table->string('metode_pembayaran')->nullable()->after('metode_pengiriman');
            $table->text('alamat_pengiriman')->nullable()->after('metode_pembayaran');

            // FK ke tabel users
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('peternak_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropForeign(['peternak_id']);

            $table->dropColumn([
                'order_number',
                'user_id',
                'peternak_id',
                'metode_pengiriman',
                'metode_pembayaran',
                'alamat_pengiriman',
            ]);

            // Kembalikan ke NOT NULL (hanya aman jika tabel kosong)
            $table->uuid('buyer_profile_id')->nullable(false)->change();
            $table->uuid('product_id')->nullable(false)->change();
            $table->text('delivery_address')->nullable(false)->change();
        });
    }
};
