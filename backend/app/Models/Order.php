<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $guarded = [];

    // ── Relasi lama (dipakai oleh createOrder) ─────────────────────────────

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function buyerProfile(): BelongsTo
    {
        return $this->belongsTo(BuyerProfile::class);
    }

    // ── Relasi baru (dipakai oleh checkout) ───────────────────────────────

    /** Pembeli (User langsung, bukan BuyerProfile) */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** Peternak penerima pesanan */
    public function peternak(): BelongsTo
    {
        return $this->belongsTo(User::class, 'peternak_id');
    }

    /** Item-item dalam satu order (hasil checkout multi-produk) */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /** Pembayaran untuk pesanan ini */
    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    /** Ulasan untuk pesanan ini */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    /** Pengiriman logistik untuk pesanan ini */
    public function shipment(): HasOne
    {
        return $this->hasOne(Shipment::class, 'order_id');
    }
}
