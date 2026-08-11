<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadProductImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'images'   => ['required', 'array', 'max:3'], // Maksimal 3 file
            'images.*' => ['image', 'mimes:jpeg,png,jpg', 'max:2048'], // Maksimal 2MB per file
        ];
    }
}