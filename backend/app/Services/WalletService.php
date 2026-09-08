<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\PlatformRevenue;
use App\Models\User;
use App\Models\Wallet;
use App\Models\Withdrawal;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class WalletService
{
    protected const MIN_WITHDRAWAL = 20000;
    protected const WITHDRAWAL_FEE = 2500;
    protected const MIN_HOURS_BETWEEN_WITHDRAWALS = 24;

    /**
     * Ambil saldo wallet user. Kalau belum pernah ada transaksi masuk,
     * otomatis dianggap 0 (wallet dibuat on-demand, bukan saat registrasi).
     */
    public function getBalance(User $user): float
    {
        $wallet = Wallet::where('user_id', $user->id)->first();
        return $wallet ? (float) $wallet->balance : 0.0;
    }

    /**
     * Ajukan penarikan saldo.
     *
     * Aturan:
     * - Minimal Rp 20.000
     * - Jeda minimal 24 jam sejak penarikan terakhir (status pending/diproses/selesai)
     * - Penarikan pertama dalam sebulan gratis, penarikan berikutnya kena
     *   fee tetap Rp 2.500
     *
     * @throws \Exception jika salah satu aturan di atas dilanggar, atau saldo tidak cukup
     */
    public function requestWithdrawal(User $user, float $amount, string $bankName, string $bankAccountNumber, string $bankAccountName): Withdrawal
    {
        if ($amount < self::MIN_WITHDRAWAL) {
            throw new \Exception('Minimal penarikan adalah Rp ' . number_format(self::MIN_WITHDRAWAL, 0, ',', '.') . '.');
        }

        $wallet = Wallet::where('user_id', $user->id)->first();
        if (!$wallet || $wallet->balance < $amount) {
            throw new \Exception('Saldo tidak mencukupi.');
        }

        // Cek jeda minimal 24 jam dari penarikan terakhir yang masih berjalan/selesai
        $lastWithdrawal = Withdrawal::where('user_id', $user->id)
            ->whereIn('status', ['pending', 'diproses', 'selesai'])
            ->latest('created_at')
            ->first();

        if ($lastWithdrawal) {
            $hoursSinceLast = $lastWithdrawal->created_at->diffInMinutes(now()) / 60;
            if ($hoursSinceLast < self::MIN_HOURS_BETWEEN_WITHDRAWALS) {
                $sisaJam = (int) ceil(self::MIN_HOURS_BETWEEN_WITHDRAWALS - $hoursSinceLast);
                throw new \Exception("Anda baru bisa mengajukan penarikan lagi dalam {$sisaJam} jam.");
            }
        }

        // Penarikan pertama dalam bulan berjalan gratis, selanjutnya kena fee
        $withdrawalCountThisMonth = Withdrawal::where('user_id', $user->id)
            ->whereIn('status', ['pending', 'diproses', 'selesai'])
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        $fee = $withdrawalCountThisMonth === 0 ? 0 : self::WITHDRAWAL_FEE;
        $netAmount = $amount - $fee;

        if ($netAmount <= 0) {
            throw new \Exception('Nominal penarikan terlalu kecil setelah dipotong biaya admin.');
        }

        return DB::transaction(function () use ($user, $wallet, $amount, $fee, $netAmount, $bankName, $bankAccountNumber, $bankAccountName) {
            $withdrawal = Withdrawal::create([
                'id'                   => Str::uuid()->toString(),
                'user_id'              => $user->id,
                'amount'               => $amount,
                'fee'                  => $fee,
                'net_amount'           => $netAmount,
                'bank_name'            => $bankName,
                'bank_account_number'  => $bankAccountNumber,
                'bank_account_name'    => $bankAccountName,
                'status'               => 'pending',
            ]);

            // Saldo langsung dikurangi begitu request diajukan, supaya
            // tidak bisa dipakai lagi untuk request lain sebelum diproses admin.
            $wallet->decrement('balance', $amount);

            if ($fee > 0) {
                PlatformRevenue::create([
                    'id'            => Str::uuid()->toString(),
                    'source'        => 'withdrawal_fee',
                    'withdrawal_id' => $withdrawal->id,
                    'user_id'       => $user->id,
                    'amount'        => $fee,
                ]);
            }

            return $withdrawal;
        });
    }

    /**
     * Admin memproses (menyelesaikan atau menolak) permintaan penarikan.
     * Kalau ditolak, saldo dikembalikan ke wallet user.
     */
    public function processWithdrawal(string $withdrawalId, string $status, ?string $adminNote = null): Withdrawal
    {
        $withdrawal = Withdrawal::findOrFail($withdrawalId);

        return DB::transaction(function () use ($withdrawal, $status, $adminNote) {
            if ($status === 'ditolak') {
                $wallet = Wallet::where('user_id', $withdrawal->user_id)->first();
                if ($wallet) {
                    $wallet->increment('balance', $withdrawal->amount);
                }

                // Batalkan pencatatan fee kalau sempat tercatat, karena
                // penarikannya batal dan fee tidak jadi dipungut.
                PlatformRevenue::where('withdrawal_id', $withdrawal->id)->delete();
            }

            $withdrawal->update([
                'status'       => $status,
                'admin_note'   => $adminNote,
                'processed_at' => now(),
            ]);

            return $withdrawal;
        });
    }
}