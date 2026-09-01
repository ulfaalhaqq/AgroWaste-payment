<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AuthService
{
    /**
     * Menangani logika registrasi user baru beserta profilnya.
     */
    public function registerUser(array $data): User
    {
        // Menggunakan database transaction agar jika gagal membuat profil, user juga batal dibuat
        return DB::transaction(function () use ($data) {

            // 1. Buat User Inti
            $user = User::create([
                'id' => Str::uuid()->toString(),
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'role' => $data['role'],
                'phone' => $data['phone'] ?? null,
            ]);

            // 2. Buat Profil berdasarkan Role
            if ($data['role'] === 'peternak') {
                $user->peternakProfile()->create([
                    'id' => Str::uuid()->toString(),
                    'nama_kandang' => 'Kandang ' . $user->name, // Nama default awal
                    'provinsi' => 'Belum diisi',
                    'kabupaten' => 'Belum diisi',
                    'kecamatan' => 'Belum diisi',
                ]);
            } elseif ($data['role'] === 'pembeli') {
                $user->buyerProfile()->create([
                    'id' => Str::uuid()->toString(),
                    'provinsi' => 'Belum diisi',
                    'kabupaten' => 'Belum diisi',
                ]);
            } elseif ($data['role'] === 'logistik') {
                $user->logistikProfile()->create([
                    'id' => Str::uuid()->toString(),
                    'company_name' => 'Mitra Logistik ' . $user->name,
                    'vehicle_type' => 'Motor / Pickup',
                    'plat_nomor' => 'N 1234 AG',
                ]);
            }

            return $user;
        });
    }

    /**
     * Menangani logika pengecekan login.
     */
    public function attemptLogin(string $email, string $password): ?User
    {
        $user = User::where('email', $email)->first();

        if (!$user || !Hash::check($password, $user->password)) {
            return null;
        }

        if ($user->is_suspended) {
            throw new \Exception('Akun Anda telah ditangguhkan karena pelanggaran komunitas. Silakan hubungi admin.');
        }

        return $user;
    }
    public function changePassword(User $user, string $currentPassword, string $newPassword): bool
    {
        if (!Hash::check($currentPassword, $user->password)) {
            throw new \Exception('Kata sandi sekarang tidak sesuai.');
        }

        $user->update([
            'password' => Hash::make($newPassword),
        ]);

        return true;
    }
}