<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('peternak_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('user_id')->unique();
            $table->string('nama_peternakan');
            $table->jsonb('jenis_ternak')->default('[]');
            $table->integer('kapasitas_ternak')->nullable();
            $table->text('deskripsi')->nullable();
            $table->string('provinsi', 100);
            $table->string('kabupaten', 100);
            $table->string('kecamatan', 100);
            $table->decimal('lat', 10, 7)->nullable();
            $table->decimal('lng', 10, 7)->nullable();
            $table->decimal('total_sold_kg', 12, 2)->default(0);
            $table->string('badge', 30)->default('none');
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->index('provinsi');
            $table->index('badge');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('peternak_profiles');
    }
};