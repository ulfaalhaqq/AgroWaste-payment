<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Order;
use App\Models\LogistikProfile;

class Shipment extends Model
{
    use HasUuids;

    protected $fillable = [
        'order_id',
        'logistik_profile_id',
        'status',
        'tracking_notes',
        'cod_deposit_status',
        'cod_proof_path',
        'cod_deadline',
        'cod_warned_at',
    ];

    protected $casts = [
        'cod_deadline' => 'datetime',
        'cod_warned_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function logistikProfile(): BelongsTo
    {
        return $this->belongsTo(LogistikProfile::class);
    }
}