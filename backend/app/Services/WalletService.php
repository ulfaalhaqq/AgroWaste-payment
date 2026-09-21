<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\PlatformRevenue;
use App\Models\Shipment;
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
    protected const PLATFORM_FEE_PERCENT = 5;

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
     * - Penarikan pertama dalam sebulan gratis, penarikan berikutnya kena fee tetap Rp 2.500
     * @throws \Exception jika salah satu aturan di atas dilanggar atau saldo tidak cukup
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
                'id' => Str::uuid()->toString(),
                'user_id' => $user->id,
                'amount' => $amount,
                'fee' => $fee,
                'net_amount' => $netAmount,
                'bank_name' => $bankName,
                'bank_account_number' => $bankAccountNumber,
                'bank_account_name' => $bankAccountName,
                'status' => 'pending',
            ]);

            // Saldo langsung dikurangi begitu request diajukan, supaya tidak bisa dipakai lagi untuk request lain sebelum diproses admin.
            $wallet->decrement('balance', $amount);

            if ($fee > 0) {
                PlatformRevenue::create([
                    'id' => Str::uuid()->toString(),
                    'source' => 'withdrawal_fee',
                    'withdrawal_id' => $withdrawal->id,
                    'user_id' => $user->id,
                    'amount' => $fee,
                ]);
            }

            return $withdrawal;
        });
    }

    /**
     * Admin memproses (menyelesaikan atau menolak) permintaan penarikan.
     * Kalau ditolak, saldo dikembalikan ke wallet user.
     *
     * @throws \Exception jika withdrawal sudah pernah diproses sebelumnya —
     *                     ini mencegah admin (sengaja atau tidak sengaja,
     *                     misal double-klik atau race condition dua admin)
     *                     memproses ulang penarikan yang statusnya sudah
     *                     final. Tanpa guard ini, memproses ulang sebagai
     *                     "ditolak" setelah sebelumnya "selesai" akan
     *                     mengembalikan saldo padahal dana sudah benar-benar
     *                     ditransfer admin secara manual — user bisa menarik
     *                     dua kali untuk satu permintaan yang sama.
     */
    public function processWithdrawal(string $withdrawalId, string $status, ?string $adminNote = null): Withdrawal
    {
        $withdrawal = Withdrawal::findOrFail($withdrawalId);

        if ($withdrawal->status !== 'pending') {
            throw new \Exception('Penarikan ini sudah diproses sebelumnya dan tidak dapat diubah lagi.');
        }

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
                'status' => $status,
                'admin_note' => $adminNote,
                'processed_at' => now(),
            ]);

            return $withdrawal;
        });
    }

    /**
     * Kurir mengunggah bukti setoran cash COD ke rekening admin.
     * Status berubah jadi "menunggu_verifikasi", menunggu admin cek.
     *
     * @throws \Exception jika shipment tidak dalam status yang tepat
     */
    public function uploadCodProof(Shipment $shipment, string $proofPath): Shipment
    {
        if ($shipment->cod_deposit_status !== 'menunggu_setor') {
            throw new \Exception('Pengiriman ini tidak sedang menunggu setoran COD.');
        }

        $shipment->update([
            'cod_deposit_status' => 'menunggu_verifikasi',
            'cod_proof_path' => $proofPath,
        ]);

        return $shipment;
    }

    /**
     * Admin memverifikasi setoran COD dari kurir. Setelah dikonfirmasi,
     * BARU wallet peternak/penjual (95% subtotal) dan kurir (100% ongkir)
     * dikreditkan sekaligus — karena baru di titik inilah dana benar-benar dipastikan sampai ke platform.
     * @throws \Exception jika shipment/order tidak valid untuk diproses
     */
    public function confirmCodSettlement(Shipment $shipment): void
    {
        if ($shipment->cod_deposit_status !== 'menunggu_verifikasi') {
            throw new \Exception('Setoran COD ini belum diunggah kurir atau sudah diproses.');
        }

        $order = $shipment->order;
        if (!$order || $order->metode_pembayaran !== 'cod') {
            throw new \Exception('Data pesanan untuk pengiriman ini tidak valid.');
        }

        DB::transaction(function () use ($shipment, $order) {
            // Kredit wallet peternak (95% dari subtotal produk)
            $feeAdmin = round(((float) $order->subtotal_produk) * self::PLATFORM_FEE_PERCENT / 100, 2);
            $saldoPenjual = ((float) $order->subtotal_produk) - $feeAdmin;

            $sellerWallet = Wallet::firstOrCreate(
                ['user_id' => $order->peternak_id],
                ['id' => Str::uuid()->toString(), 'balance' => 0]
            );
            $sellerWallet->increment('balance', $saldoPenjual);

            PlatformRevenue::create([
                'id' => Str::uuid()->toString(),
                'source' => 'transaction_fee',
                'order_id' => $order->id,
                'user_id' => $order->peternak_id,
                'amount' => $feeAdmin,
            ]);

            // Kredit wallet kurir (100% ongkir)
            $courierUserId = $shipment->logistikProfile->user_id ?? null;
            if ($courierUserId && (float) $order->ongkir > 0) {
                $courierWallet = Wallet::firstOrCreate(
                    ['user_id' => $courierUserId],
                    ['id' => Str::uuid()->toString(), 'balance' => 0]
                );
                $courierWallet->increment('balance', (float) $order->ongkir);
            }

            $shipment->update(['cod_deposit_status' => 'selesai']);
        });
    }
    /**
     * Admin mencatat bahwa peringatan sudah dikirim ke kurir yang telat menyetor COD. 
     * Tidak melakukan apa pun ke wallet, cuma menandai waktu peringatan supaya bisa dihitung kapan boleh disuspend.
     */
    public function warnLateCodDeposit(Shipment $shipment): void
    {
        if ($shipment->cod_deposit_status !== 'menunggu_setor') {
            throw new \Exception('Pengiriman ini sudah tidak dalam status menunggu setoran.');
        }

        $shipment->update(['cod_warned_at' => now()]);
    }

    /**
     * Cek apakah kurir sudah boleh disuspend (sudah diperingatkan lebih dari 24 jam yang lalu dan masih belum menyetor).
     */
    public function isEligibleForCodSuspend(Shipment $shipment): bool
    {
        return $shipment->cod_deposit_status === 'menunggu_setor'
            && $shipment->cod_warned_at !== null
            && $shipment->cod_warned_at->diffInHours(now()) >= 24;
    }
}