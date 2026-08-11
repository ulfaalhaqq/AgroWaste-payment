<?php

namespace App\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Hanya izinkan user dengan role pembeli
        return $this->user() && $this->user()->role === 'pembeli';
    }

    public function rules(): array
    {
        return [
            'product_id'       => ['required', 'uuid', 'exists:products,id'],
            'quantity_kg'      => ['required', 'numeric', 'min:1'],
            'delivery_address' => ['required', 'string'],
        ];
    }
}