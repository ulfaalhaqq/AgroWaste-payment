<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('logistik_profiles', function (Blueprint $table) {
            $table->decimal('lat', 10, 7)->nullable()->after('vehicle_plate');
            $table->decimal('lng', 10, 7)->nullable()->after('lat');
            $table->string('alamat_posisi')->nullable()->after('lng');
            $table->string('kecamatan')->nullable()->after('alamat_posisi');
            $table->string('kabupaten')->nullable()->after('kecamatan');
            $table->string('provinsi')->nullable()->after('kabupaten');
        });
    }

    public function down(): void
    {
        Schema::table('logistik_profiles', function (Blueprint $table) {
            $table->dropColumn(['lat', 'lng', 'alamat_posisi', 'kecamatan', 'kabupaten', 'provinsi']);
        });
    }
};
