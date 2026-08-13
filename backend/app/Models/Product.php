<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

// Tambahkan "implements HasMedia" di sini
class Product extends Model implements HasMedia
{
    use HasUuids, SoftDeletes;

    // Tambahkan trait InteractsWithMedia di sini
    use InteractsWithMedia;

    protected $fillable = [
        'peternak_profile_id',
        'category_id',
        'name',
        'slug',
        'description',
        'jenis_ternak',
        'kondisi',
        'price',
        'unit',
        'stock_kg',
        'min_order_kg',
        'provinsi',
        'kabupaten',
        'kecamatan',
        'status',
        'rejection_reason',
        'rating_avg',
        'review_count',
    ];

    protected $casts = [
        'rating_avg' => 'float',
        'review_count' => 'integer',
    ];

    protected $appends = ['image_url', 'image_urls'];

    // ── Media collection ────────────────────────────────────────────────────

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('product_images')
            ->acceptsMimeTypes(['image/jpeg', 'image/jpg', 'image/png']);
    }

    // ── Accessors (otomatis ikut JSON via $appends) ──────────────────────────

    /** URL gambar pertama, atau null kalau belum ada gambar. */
    public function getImageUrlAttribute(): ?string
    {
        $url = $this->getFirstMediaUrl('product_images');
        return $url !== '' ? $url : null;
    }

    /** Array URL semua gambar di collection product_images. */
    public function getImageUrlsAttribute(): array
    {
        return $this->getMedia('product_images')
            ->map(fn(Media $m) => $m->getUrl())
            ->values()
            ->toArray();
    }

    public function getRatingAvgAttribute($value): float
    {
        if ($value !== null && (float) $value > 0) {
            return (float) $value;
        }
        $avg = $this->reviews()->avg('rating');
        return $avg ? round((float) $avg, 1) : 0.0;
    }

    public function getReviewCountAttribute($value): int
    {
        if ($value !== null && (int) $value > 0) {
            return (int) $value;
        }
        return $this->reviews()->count();
    }

    // ── Relasi ──────────────────────────────────────────────────────────────

    public function peternakProfile(): BelongsTo
    {
        return $this->belongsTo(PeternakProfile::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function reviews(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Review::class);
    }
}