<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_revenues', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Sumber pendapatan: dari fee transaksi (5%) atau fee penarikan (Rp 2.500)
            $table->enum('source', ['transaction_fee', 'withdrawal_fee']);

            $table->uuid('order_id')->nullable();      // diisi kalau source = transaction_fee
            $table->uuid('withdrawal_id')->nullable(); // diisi kalau source = withdrawal_fee
            $table->uuid('user_id')->nullable();       // siapa yang "menyumbang" fee ini (penjual/kurir)

            $table->decimal('amount', 15, 2);

            $table->timestamps();

            $table->foreign('order_id')->references('id')->on('orders')->nullOnDelete();
            $table->foreign('withdrawal_id')->references('id')->on('withdrawals')->nullOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_revenues');
    }
};