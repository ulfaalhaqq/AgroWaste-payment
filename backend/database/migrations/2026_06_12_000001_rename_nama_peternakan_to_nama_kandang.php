<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('peternak_profiles', function (Blueprint $table) {
            $table->renameColumn('nama_peternakan', 'nama_kandang');
        });
    }

    public function down(): void
    {
        Schema::table('peternak_profiles', function (Blueprint $table) {
            $table->renameColumn('nama_kandang', 'nama_peternakan');
        });
    }
};
