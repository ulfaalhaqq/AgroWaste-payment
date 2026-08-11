<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LogistikProfile extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'company_name',
        'vehicle_plate',
        'lat',
        'lng',
        'alamat_posisi',
        'kecamatan',
        'kabupaten',
        'provinsi',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}