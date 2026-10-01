"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface Withdrawal {
  id: string;
  amount: string | number;
  fee: string | number;
  net_amount: string | number;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  status: "pending" | "diproses" | "selesai" | "ditolak";
  admin_note: string | null;
  created_at: string;
}

interface WalletData {
  balance: number;
  withdrawals: Withdrawal[];
}

// ---- Aturan bisnis penarikan (samakan dengan validasi di backend) ----
const MIN_WITHDRAWAL = 20000;
const WITHDRAWAL_COOLDOWN_HOURS = 24;
const WITHDRAWAL_FEE = 2500;

function formatRupiah(n: string | number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(n));
}

function formatDate(d: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
}

// Badge status: tiap status dapat warna & label sendiri
function withdrawalStatusInfo(status: Withdrawal["status"]) {
  switch (status) {
    case "pending":
      return { label: "MENUNGGU", cls: "bg-amber-100 text-amber-700" };
    case "diproses":
      return { label: "DIPROSES", cls: "bg-blue-100 text-blue-700" };
    case "selesai":
      return {
        label: "SELESAI",
        cls: "bg-seller-primary-light text-seller-semgreen",
      };
    case "ditolak":
      return { label: "DITOLAK", cls: "bg-red-100 text-red-700" };
    default:
      return { label: status, cls: "bg-[#EAE6E1] text-seller-textsecondary" };
  }
}

export default function SellerWalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchWallet = () => {
    apiFetch("/wallet")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.success) setWallet(json.data as WalletData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const resetForm = () => {
    setAmount("");
    setBankName("");
    setBankAccountNumber("");
    setBankAccountName("");
    setFormError(null);
  };

  // Penarikan TERAKHIR berdasarkan created_at (bukan cuma elemen pertama di
  // array — urutan dari API tidak dijamin selalu terbaru duluan), dipakai
  // untuk mengecek jeda minimal 24 jam antar penarikan.
  const getLastWithdrawal = (): Withdrawal | null => {
    if (!wallet?.withdrawals || wallet.withdrawals.length === 0) return null;
    return [...wallet.withdrawals].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0];
  };

  // Hitung berapa kali sudah menarik saldo BULAN INI (bulan & tahun kalender
  // berjalan), untuk menentukan apakah penarikan berikutnya masih gratis
  // (penarikan ke-1) atau kena biaya admin Rp 2.500 (penarikan ke-2 dst).
  const getWithdrawalCountThisMonth = (): number => {
    if (!wallet?.withdrawals) return 0;
    const now = new Date();
    return wallet.withdrawals.filter((w) => {
      const d = new Date(w.created_at);
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth()
      );
    }).length;
  };

  const withdrawalCountThisMonth = getWithdrawalCountThisMonth();
  const isNextWithdrawalFree = withdrawalCountThisMonth === 0;
  // Estimasi biaya admin untuk penarikan yang SEDANG diajukan di modal ini.
  // Ini hanya estimasi tampilan di frontend — nilai fee final yang tersimpan
  // tetap ditentukan & dihitung ulang oleh backend saat memproses request.
  const estimatedFee = isNextWithdrawalFree ? 0 : WITHDRAWAL_FEE;

  const handleSubmitWithdraw = async () => {
    setFormError(null);

    if (!amount || !bankName || !bankAccountNumber || !bankAccountName) {
      setFormError("Semua kolom wajib diisi.");
      return;
    }

    const numericAmount = Number(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      setFormError("Masukkan nominal penarikan yang valid.");
      return;
    }

    // Aturan: minimal penarikan Rp 20.000
    if (numericAmount < MIN_WITHDRAWAL) {
      setFormError(
        `Minimal penarikan adalah ${formatRupiah(MIN_WITHDRAWAL)}.`,
      );
      return;
    }

    // Saldo harus cukup untuk nominal yang diajukan
    if (wallet && numericAmount > wallet.balance) {
      setFormError(
        `Saldo Anda tidak mencukupi. Saldo tersedia: ${formatRupiah(
          wallet.balance,
        )}.`,
      );
      return;
    }

    // Aturan: jeda minimal 24 jam antar penarikan
    const lastWithdrawal = getLastWithdrawal();
    if (lastWithdrawal) {
      const hoursSinceLast =
        (Date.now() - new Date(lastWithdrawal.created_at).getTime()) /
        (1000 * 60 * 60);
      if (hoursSinceLast < WITHDRAWAL_COOLDOWN_HOURS) {
        const remainingHours = Math.ceil(
          WITHDRAWAL_COOLDOWN_HOURS - hoursSinceLast,
        );
        setFormError(
          `Anda baru bisa menarik saldo lagi dalam ${remainingHours} jam (jeda minimal 24 jam antar penarikan).`,
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await apiFetch("/wallet/withdraw", {
        method: "POST",
        body: JSON.stringify({
          amount: numericAmount,
          bank_name: bankName,
          bank_account_number: bankAccountNumber,
          bank_account_name: bankAccountName,
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setFormError(json.message ?? "Gagal mengajukan penarikan.");
        return;
      }

      setIsModalOpen(false);
      resetForm();
      fetchWallet();
      setIsSuccessModalOpen(true);
    } catch {
      setFormError("Tidak dapat terhubung ke server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in pb-10">
        {/* Header */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-seller-textprimary mb-1">
            Saldo & Penarikan
          </h2>
          <p className="text-xs sm:text-sm text-seller-textsecondary">
            Kelola saldo hasil penjualan dan ajukan penarikan ke rekening bank Anda.
          </p>
        </div>

        {/* Kartu Saldo Utama */}
        <div className="bg-seller-primary rounded-2xl p-6 lg:p-8 text-white flex flex-col justify-between relative overflow-hidden shadow-lg shadow-seller-primary/20">
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white opacity-5 rounded-full blur-2xl pointer-events-none" />

          <span className="text-xs font-bold text-white/70 uppercase tracking-wider mb-3 block">
            Saldo Tersedia
          </span>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-4xl sm:text-5xl font-bold tracking-tight font-tabular">
              {loading ? "..." : formatRupiah(wallet?.balance ?? 0)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto self-start px-6 py-3 bg-white text-seller-primary rounded-xl font-bold text-sm shadow-sm hover:bg-gray-50 transition-colors"
          >
            Tarik Saldo
          </button>
        </div>

        {/* Riwayat Penarikan */}
        <div className="bg-seller-surfacewhite border border-seller-hairline rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-seller-hairline">
            <h3 className="text-base font-bold text-seller-textprimary">
              Riwayat Penarikan
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#F9F8F6] text-[10px] font-bold text-seller-textsecondary uppercase tracking-wider border-b border-seller-hairline">
                <tr>
                  <th className="px-5 py-3">Tanggal</th>
                  <th className="px-5 py-3">Nominal</th>
                  <th className="px-5 py-3">Biaya Admin</th>
                  <th className="px-5 py-3">Diterima</th>
                  <th className="px-5 py-3">Rekening Tujuan</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-seller-hairline bg-white">
                {loading && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-8 text-center text-seller-textsecondary text-xs animate-pulse"
                    >
                      Memuat riwayat...
                    </td>
                  </tr>
                )}
                {!loading &&
                  (!wallet?.withdrawals || wallet.withdrawals.length === 0) && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-8 text-center text-seller-textsecondary text-xs"
                      >
                        Belum ada riwayat penarikan.
                      </td>
                    </tr>
                  )}
                {!loading &&
                  wallet?.withdrawals.map((w) => {
                    const { label, cls } = withdrawalStatusInfo(w.status);
                    return (
                      <tr
                        key={w.id}
                        className="hover:bg-seller-warmbg/30 transition-colors"
                      >
                        <td className="px-5 py-3.5 text-xs text-seller-textsecondary">
                          {formatDate(w.created_at)}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-seller-textprimary font-tabular">
                          {formatRupiah(w.amount)}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-seller-textsecondary font-tabular">
                          {formatRupiah(w.fee)}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-seller-semgreen font-tabular">
                          {formatRupiah(w.net_amount)}
                        </td>
                        <td className="px-5 py-3.5 text-xs">
                          <div className="font-semibold text-seller-textprimary">
                            {w.bank_name}
                          </div>
                          <div className="text-seller-textsecondary">
                            {w.bank_account_number} a.n. {w.bank_account_name}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${cls}`}
                          >
                            {label}
                          </span>
                          {w.status === "ditolak" && w.admin_note && (
                            <p className="text-[10px] text-red-600 mt-1 max-w-[200px] whitespace-normal">
                              {w.admin_note}
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Tarik Saldo */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-seller-surfacewhite w-full max-w-md rounded-2xl border border-seller-hairline overflow-hidden animate-fade-in flex flex-col max-h-[92vh]">
            {/* Header - tetap */}
            <div className="p-4 border-b border-seller-hairline flex justify-between items-center shrink-0">
              <h3 className="font-bold text-seller-textprimary">
                Tarik Saldo
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="text-seller-textsecondary hover:text-seller-textprimary"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Body - scroll */}
            <div className="p-5 overflow-y-auto space-y-4">
              <div>
                <h4 className="text-sm font-bold text-seller-textprimary mb-1.5">
                  Penarikan Saldo
                </h4>
                <p className="text-xs text-seller-textsecondary leading-relaxed">
                  Minimal penarikan Rp 20.000. Penarikan pertama tiap bulan
                  gratis, penarikan berikutnya dikenakan biaya admin Rp 2.500.
                  Jeda minimal 24 jam antar penarikan.
                </p>
              </div>

              {/* Info biaya admin real-time berdasarkan riwayat bulan ini */}
              <div
                className={`px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between ${
                  isNextWithdrawalFree
                    ? "bg-emerald-50 text-seller-semgreen border border-emerald-100"
                    : "bg-amber-50 text-amber-700 border border-amber-100"
                }`}
              >
                <span>
                  {isNextWithdrawalFree
                    ? "Penarikan ini GRATIS (penarikan ke-1 bulan ini)"
                    : `Penarikan ke-${withdrawalCountThisMonth + 1} bulan ini`}
                </span>
                <span className="font-tabular">
                  {isNextWithdrawalFree
                    ? "Rp 0"
                    : `Biaya ${formatRupiah(estimatedFee)}`}
                </span>
              </div>

              {formError && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-semibold">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-seller-textsecondary mb-1">
                  Nominal Penarikan
                </label>
                <input
                  type="number"
                  min={MIN_WITHDRAWAL}
                  placeholder="Minimal Rp 20.000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-seller-warmbg border border-seller-hairline rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-seller-primary"
                />
                {wallet && (
                  <p className="text-[10px] text-seller-textsecondary mt-1">
                    Saldo tersedia: {formatRupiah(wallet.balance)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-seller-textsecondary mb-1">
                  Nama Bank
                </label>
                <input
                  type="text"
                  placeholder="Contoh: BCA, Mandiri, BRI"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 bg-seller-warmbg border border-seller-hairline rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-seller-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-seller-textsecondary mb-1">
                  Nomor Rekening
                </label>
                <input
                  type="text"
                  placeholder="1234567890"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-seller-warmbg border border-seller-hairline rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-seller-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-seller-textsecondary mb-1">
                  Nama Pemilik Rekening
                </label>
                <input
                  type="text"
                  placeholder="Sesuai buku tabungan"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  className="w-full px-3 py-2 bg-seller-warmbg border border-seller-hairline rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-seller-primary"
                />
              </div>
            </div>

            {/* Footer - tetap */}
            <div className="p-4 border-t border-seller-hairline flex justify-end gap-3 bg-[#F9F8F6] shrink-0">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold text-seller-textsecondary hover:text-seller-textprimary transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleSubmitWithdraw}
                disabled={submitting}
                className="px-4 py-2 bg-seller-primary hover:bg-seller-primary-hover text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-60"
              >
                {submitting ? "Mengajukan..." : "Ajukan Penarikan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sukses Pengajuan */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-seller-surfacewhite w-full max-w-sm rounded-3xl border border-seller-hairline overflow-hidden p-8 text-center space-y-4 animate-fade-in shadow-xl">
            <div className="w-16 h-16 bg-seller-primary-light text-seller-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-seller-textprimary">
                Pengajuan Terkirim
              </h3>
              <p className="text-sm text-seller-textsecondary mt-2 leading-relaxed">
                Permintaan penarikan Anda sedang menunggu persetujuan admin.
                Proses ini biasanya memakan waktu hingga 1x24 jam.
              </p>
            </div>
            <button
              onClick={() => setIsSuccessModalOpen(false)}
              className="w-full mt-6 py-3 bg-seller-primary hover:bg-seller-primary-hover text-white rounded-xl text-sm font-bold transition-colors"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
} 