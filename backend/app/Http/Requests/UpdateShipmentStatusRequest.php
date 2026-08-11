<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateShipmentStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status'         => ['required', 'string', 'in:dijadwalkan,dalam_perjalanan,sedang_berjalan,terkirim,selesai,dikirim'],
            'tracking_notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}