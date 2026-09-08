<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Withdrawal;
use App\Services\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WalletController extends Controller
{
    public function __construct(protected WalletService $walletService) {}

    /**
     * Lihat saldo & riwayat penarikan milik user yang sedang login
     * (dipakai oleh peternak maupun kurir).
     */
    public function show(): JsonResponse
    {
        $user = Auth::user();

        $withdrawals = Withdrawal::where('user_id', $user->id)
            ->latest('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'balance'     => $this->walletService->getBalance($user),
                'withdrawals' => $withdrawals,
            ],
        ]);
    }

    /**
     * Ajukan penarikan saldo.
     */
    public function requestWithdrawal(Request $request): JsonResponse
    {
        $request->validate([
            'amount'               => ['required', 'numeric', 'min:1'],
            'bank_name'            => ['required', 'string', 'max:100'],
            'bank_account_number'  => ['required', 'string', 'max:50'],
            'bank_account_name'    => ['required', 'string', 'max:100'],
        ]);

        try {
            $withdrawal = $this->walletService->requestWithdrawal(
                Auth::user(),
                (float) $request->amount,
                $request->bank_name,
                $request->bank_account_number,
                $request->bank_account_name,
            );

            return response()->json([
                'success' => true,
                'message' => 'Permintaan penarikan berhasil diajukan.',
                'data'    => $withdrawal,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * [Admin] Lihat semua permintaan penarikan dari seluruh user.
     */
    public function adminIndex(): JsonResponse
    {
        $withdrawals = Withdrawal::with('user')
            ->latest('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $withdrawals,
        ]);
    }

    /**
     * [Admin] Proses (selesaikan/tolak) permintaan penarikan.
     */
    public function adminProcess(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'status'     => ['required', 'string', 'in:selesai,ditolak'],
            'admin_note' => ['nullable', 'string', 'max:255'],
        ]);

        try {
            $withdrawal = $this->walletService->processWithdrawal(
                $id,
                $request->status,
                $request->admin_note,
            );

            return response()->json([
                'success' => true,
                'message' => 'Status penarikan berhasil diperbarui.',
                'data'    => $withdrawal,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}