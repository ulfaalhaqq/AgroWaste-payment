<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;

class ProfileController extends Controller
{
    /**
     * Mengambil data profil user yang sedang login beserta relasinya
     */
    public function show(): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $user->load(['peternakProfile', 'buyerProfile', 'logistikProfile']);

        return response()->json([
            'success' => true,
            'message' => 'Data profil berhasil diambil.',
            'data' => $user
        ], 200);
    }

    /**
     * Memperbarui data profil berdasarkan role pengguna
     */
    public function update(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // 1. Update basic fields on users table
        $userFields = $request->only(['name', 'email', 'phone', 'avatar_url']);
        if (!empty($userFields)) {
            $user->update($userFields);
        }

        // 2. Update specific profile table based on role
        if ($user->role === 'logistik' && $user->logistikProfile) {
            $user->logistikProfile->update($request->only([
                'company_name',
                'vehicle_plate',
                'lat',
                'lng',
                'alamat_posisi',
                'kecamatan',
                'kabupaten',
                'provinsi'
            ]));
        } elseif ($user->role === 'peternak' && $user->peternakProfile) {
            $peternakData = $request->only([
                'nama_kandang',
                'deskripsi',
                'provinsi',
                'kabupaten',
                'kecamatan',
                'lat',
                'lng',
                'jenis_ternak',
                'kapasitas_ternak',
                'bank_account'
            ]);

            // If jenis_ternak is a JSON string from frontend, decode it so it stores correctly with array cast
            if (isset($peternakData['jenis_ternak']) && is_string($peternakData['jenis_ternak'])) {
                $decoded = json_decode($peternakData['jenis_ternak'], true);
                if (is_array($decoded)) {
                    $peternakData['jenis_ternak'] = $decoded;
                }
            }

            $user->peternakProfile->update($peternakData);
        } elseif ($user->role === 'pembeli' && $user->buyerProfile) {
            $user->buyerProfile->update($request->only([
                'nama_instansi',
                'tipe_pembeli',
                'provinsi',
                'kabupaten'
            ]));
        }

        // Refresh and load latest data
        $user->refresh();
        $user->load(['peternakProfile', 'buyerProfile', 'logistikProfile']);

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui.',
            'data' => $user
        ], 200);
    }

    /**
     * Mengunggah foto profil pengguna
     */
    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        /** @var \App\Models\User $user */
        $user = Auth::user();

        if ($request->hasFile('avatar')) {
            $file = $request->file('avatar');
            $path = $file->store('avatars', 'public');

            // Hapus avatar lama jika ada di storage lokal
            if ($user->avatar_url && str_contains($user->avatar_url, 'storage/avatars')) {
                $oldPath = str_replace(asset('storage/'), '', $user->avatar_url);
                \Illuminate\Support\Facades\Storage::disk('public')->delete($oldPath);
            }

            $user->update([
                'avatar_url' => asset('storage/' . $path)
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Foto profil berhasil diperbarui.',
                'data' => $user->fresh()
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Gagal mengunggah foto profil.'
        ], 400);
    }
    /**
     * Menghapus foto profil pengguna
     */
    public function deleteAvatar(): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if (!$user->avatar_url) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada foto profil untuk dihapus.'
            ], 400);
        }

        // Hapus file dari storage lokal jika ada
        if (str_contains($user->avatar_url, 'storage/avatars')) {
            $oldPath = str_replace(asset('storage/'), '', $user->avatar_url);
            \Illuminate\Support\Facades\Storage::disk('public')->delete($oldPath);
        }

        $user->update(['avatar_url' => null]);

        return response()->json([
            'success' => true,
            'message' => 'Foto profil berhasil dihapus.',
            'data' => $user->fresh()
        ]);
    }
    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        /** @var \App\Models\User $user */
        $user = Auth::user();

        try {
            app(\App\Services\AuthService::class)->changePassword(
                $user,
                $request->current_password,
                $request->new_password
            );

            return response()->json([
                'success' => true,
                'message' => 'Kata sandi berhasil diperbarui.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}