<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Mengubah tipe media.model_id dari unsignedBigInteger menjadi varchar(36).
 *
 * Tabel media (Spatie) dibuat dengan morphs('model') yang menghasilkan model_id
 * bertipe bigint. Model Product memakai UUID (HasUuids) sehingga getKey() mengembalikan
 * string UUID. PostgreSQL menolak INSERT karena tipe tidak cocok.
 *
 * Langkah: drop compound index → drop kolom lama → re-add kolom varchar(36)
 * → recreate index. Aman karena tabel media masih kosong.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Langkah 1: drop compound index dan kolom model_id yang bertipe bigint.
        // Harus dua Schema::table terpisah di PostgreSQL agar DDL berjalan berurutan.
        Schema::table('media', function (Blueprint $table) {
            $table->dropIndex('media_model_type_model_id_index');
            $table->dropColumn('model_id');
        });

        // Langkah 2: tambah kolom baru bertipe varchar(36) dan recreate index.
        Schema::table('media', function (Blueprint $table) {
            $table->string('model_id', 36)->after('model_type');
            $table->index(['model_type', 'model_id'], 'media_model_type_model_id_index');
        });
    }

    public function down(): void
    {
        Schema::table('media', function (Blueprint $table) {
            $table->dropIndex('media_model_type_model_id_index');
            $table->dropColumn('model_id');
        });

        Schema::table('media', function (Blueprint $table) {
            $table->unsignedBigInteger('model_id')->after('model_type');
            $table->index(['model_type', 'model_id'], 'media_model_type_model_id_index');
        });
    }
};
