<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shipments', function (Blueprint $table) {
            // pending          = belum ada tindakan (belum sampai/belum COD)
            // menunggu_setor   = barang sudah diterima pembeli, kurir pegang cash, belum lapor
            // menunggu_verifikasi = kurir sudah upload bukti setor, tunggu admin cek
            // selesai          = admin sudah konfirmasi, wallet peternak & kurir sudah dikredit
            $table->string('cod_deposit_status')->nullable()->after('status');
            $table->string('cod_proof_path')->nullable()->after('cod_deposit_status');
            $table->timestamp('cod_deadline')->nullable()->after('cod_proof_path');
            $table->timestamp('cod_warned_at')->nullable()->after('cod_deadline');
        });
    }

    public function down(): void
    {
        Schema::table('shipments', function (Blueprint $table) {
            $table->dropColumn(['cod_deposit_status', 'cod_proof_path', 'cod_deadline', 'cod_warned_at']);
        });
    }
};