<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCartItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; 
    }

    public function rules(): array
    {
        return [
            'product_id'  => ['required', 'uuid', 'exists:products,id'],
            'quantity_kg' => ['required', 'numeric', 'min:1'], // Minimal beli 1 kg
        ];
    }
}