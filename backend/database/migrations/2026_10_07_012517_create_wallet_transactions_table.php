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
        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->id();
            // Menggunakan foreignUuid karena primary key tabel users berbentuk UUID
            $table->foreignUuid('user_id')->constrained()->onDelete('cascade');
            $table->string('type'); // 'topup', 'withdrawal', 'payment', 'income'
            $table->decimal('amount', 15, 2);
            $table->string('description')->nullable();
            $table->string('status')->default('success'); // 'pending', 'success', 'failed'
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wallet_transactions');
    }
};