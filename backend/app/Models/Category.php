<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    // Beri tahu Laravel bahwa ID kita adalah UUID string
    public $incrementing = false;
    protected $keyType = 'string';

    // Izinkan pengisian massal
    protected $guarded = [];

    // Relasi balik ke Product 
    public function products()
    {
        return $this->hasMany(Product::class);
    }
}