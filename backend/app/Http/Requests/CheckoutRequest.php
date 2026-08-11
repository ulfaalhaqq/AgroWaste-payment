<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; 
    }

    public function rules(): array
    {
        return [
            'metode_pengiriman' => ['required', 'string', 'in:pickup,logistik'],
            'metode_pembayaran' => ['required', 'string', 'in:manual,midtrans,cod'],
            // Alamat hanya wajib jika menggunakan jasa logistik
            'alamat_pengiriman' => ['required_if:metode_pengiriman,logistik', 'string', 'nullable'],
        ];
    }
}