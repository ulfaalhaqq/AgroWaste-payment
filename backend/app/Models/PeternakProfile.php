<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PeternakProfile extends Model
{
    // Karena kita pakai UUID
    public $incrementing = false;
    protected $keyType = 'string';

    // Mengizinkan semua kolom diisi secara massal (mass assignment)
    protected $guarded = [];

    protected $casts = [
        'jenis_ternak' => 'array',
    ];

    // Relasi balik ke User
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}