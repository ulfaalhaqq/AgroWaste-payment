<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;

class AuthController extends Controller
{
    private AuthService $authService;

    // Inject AuthService ke dalam Controller
    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        try {
            $user = $this->authService->registerUser($request->validated());
            
            // Buat token Sanctum
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Registrasi berhasil.',
                'data'    => [
                    'user'  => $user,
                    'token' => $token
                ]
            ], 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal melakukan registrasi: ' . $e->getMessage(),
                'data'    => null
            ], 500);
        }
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = $this->authService->attemptLogin(
            $request->validated('email'), 
            $request->validated('password')
        );

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Email atau password salah.',
                'errors'  => ['email' => ['Kredensial tidak cocok.']]
            ], 401);
        }

        // Hapus token lama agar aman, lalu buat token baru
        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil.',
            'data'    => [
                'user'  => $user,
                'token' => $token
            ]
        ], 200);
    }
}