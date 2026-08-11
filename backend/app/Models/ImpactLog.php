<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ImpactLog extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'order_id',
        'waste_managed_kg',
        'co2eq_reduced_kg',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
