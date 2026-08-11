<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; 
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'string', 'in:aktif,ditolak'],
            'rejection_reason' => ['nullable', 'string', 'required_if:status,ditolak'],
        ];
    }
}