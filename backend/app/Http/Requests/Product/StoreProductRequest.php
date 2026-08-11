<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Hanya izinkan peternak yang sedang login
        return $this->user() && $this->user()->role === 'peternak';
    }

    public function rules(): array
    {
        return [
            'name'         => ['required', 'string', 'max:255'],
            'category_id'  => ['required', 'uuid', 'exists:categories,id'],
            'jenis_ternak' => ['required', 'string', 'max:20'],
            'kondisi'      => ['nullable', 'string', 'max:100'],
            'price'        => ['required', 'numeric', 'min:0'],
            'stock_kg'     => ['required', 'numeric', 'min:0'],
            'min_order_kg' => ['required', 'numeric', 'min:1'],
            'description'  => ['nullable', 'string'],
        ];
    }
}