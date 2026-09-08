<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('withdrawals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id'); // penjual atau kurir yang request

            $table->decimal('amount', 15, 2);      // nominal yang diminta ditarik
            $table->decimal('fee', 15, 2)->default(0);       // biaya penarikan (0 atau 2500)
            $table->decimal('net_amount', 15, 2);  // amount - fee, yang beneran ditransfer admin

            $table->string('bank_name');
            $table->string('bank_account_number');
            $table->string('bank_account_name');

            $table->enum('status', ['pending', 'diproses', 'selesai', 'ditolak'])->default('pending');
            $table->text('admin_note')->nullable();
            $table->timestamp('processed_at')->nullable();

            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('withdrawals');
    }
};