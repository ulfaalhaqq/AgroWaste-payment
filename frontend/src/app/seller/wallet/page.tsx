"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Clock, Wallet } from "lucide-react";
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
// Backend hanya menghitung penarikan berstatus ini untuk jeda 24 jam dan
// penarikan gratis pertama tiap bulan (yang "ditolak" tidak dihitung).
const COUNTED_STATUSES = ["pending", "diproses", "selesai"];

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

  const withdrawals = wallet?.withdrawals ?? [];
  const countedWithdrawals = withdrawals.filter((w) =>
    COUNTED_STATUSES.includes(w.status),
  );

  // Penarikan TERAKHIR berdasarkan created_at (urutan dari API tidak dijamin
  // terbaru duluan), dipakai untuk mengecek jeda minimal 24 jam.
  const getLastWithdrawal = (): Withdrawal | null => {
    if (countedWithdrawals.length === 0) return null;
    return [...countedWithdrawals].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0];
  };

  // Jumlah penarikan BULAN INI (bulan & tahun kalender berjalan) untuk
  // menentukan penarikan berikutnya gratis (ke-1) atau kena biaya (ke-2 dst).
  const withdrawalCountThisMonth = countedWithdrawals.filter((w) => {
    const d = new Date(w.created_at);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    );
  }).length;

  const isNextWithdrawalFree = withdrawalCountThisMonth === 0;
  // Hanya estimasi tampilan; fee final dihitung ulang oleh backend.
  const estimatedFee = isNextWithdrawalFree ? 0 : WITHDRAWAL_FEE;

  // Statistik ringkas
  const inProgress = withdrawals.filter(
    (w) => w.status === "pending" || w.status === "diproses",
  );
  const inProgressTotal = inProgress.reduce(
    (acc, w) => acc + Number(w.amount || 0),
    0,
  );
  const done = withdrawals.filter((w) => w.status === "selesai");
  const doneTotal = done.reduce((acc, w) => acc + Number(w.net_amount || 0), 0);

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

  const rules = [
    { label: "Minimal penarikan", value: formatRupiah(MIN_WITHDRAWAL) },
    { label: "Penarikan pertama tiap bulan", value: "Gratis" },
    { label: "Biaya penarikan berikutnya", value: formatRupiah(WITHDRAWAL_FEE) },
    { label: "Jeda antar penarikan", value: `${WITHDRAWAL_COOLDOWN_HOURS} jam` },
  ];

  const steps = [
    {
      title: "Ajukan penarikan",
      desc: "Saldo langsung dikurangi sebesar nominal yang diajukan.",
    },
    {
      title: "Admin memproses",
      desc: "Admin memeriksa dan mentransfer manual ke rekening Anda, maksimal 1x24 jam.",
    },
    {
      title: "Selesai atau ditolak",
      desc: "Status berubah jadi Selesai. Jika ditolak, saldo dikembalikan penuh.",
    },
  ];

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

        {/* Baris ringkasan: saldo (2 kolom) + 2 kartu statistik */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Saldo */}
          <div className="col-span-2 bg-seller-primary rounded-2xl p-6 text-white relative overflow-hidden shadow-lg shadow-seller-primary/20 flex flex-col sm:flex-row sm:items-stretch justify-between gap-6">
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white opacity-5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex flex-col justify-between gap-5 relative">
              <div>
                <span className="flex items-center gap-2 text-xs font-bold text-white/70 uppercase tracking-wider mb-2">
                  <Wallet className="w-4 h-4" />
                  Saldo Tersedia
                </span>
                <span className="text-4xl xl:text-5xl font-bold tracking-tight font-tabular block">
                  {loading ? "..." : formatRupiah(wallet?.balance ?? 0)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="self-start px-6 py-3 bg-white text-seller-primary rounded-xl font-bold text-sm shadow-sm hover:bg-gray-50 transition-colors"
              >
                Tarik Saldo
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-1 gap-3 sm:min-w-[180px] relative">
              <div className="bg-white/10 rounded-xl px-4 py-3 flex flex-col justify-center">
                <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
                  Penarikan bulan ini
                </span>
                <span className="text-lg font-bold">
                  {withdrawalCountThisMonth}x
                </span>
              </div>
              <div className="bg-white/10 rounded-xl px-4 py-3 flex flex-col justify-center">
                <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
                  Biaya penarikan berikutnya
                </span>
                <span className="text-lg font-bold font-tabular">
                  {isNextWithdrawalFree ? "Gratis" : formatRupiah(estimatedFee)}
                </span>
              </div>
            </div>
          </div>

          {/* Sedang diproses */}
          <div className="bg-seller-surfacewhite border border-seller-hairline rounded-2xl p-5 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-seller-textsecondary uppercase tracking-wider">
                Sedang Diproses
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-seller-textprimary">
                {loading ? "..." : inProgress.length}
              </div>
              <div className="text-xs text-seller-textsecondary mt-1 font-tabular">
                Total {formatRupiah(inProgressTotal)}
              </div>
              <div className="text-[11px] text-seller-textsecondary mt-1.5">
                Menunggu transfer dari admin
              </div>
            </div>
          </div>

          {/* Total diterima */}
          <div className="bg-seller-surfacewhite border border-seller-hairline rounded-2xl p-5 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-seller-textsecondary uppercase tracking-wider">
                Total Diterima
              </span>
              <div className="w-8 h-8 rounded-xl bg-seller-primary-light text-seller-semgreen flex items-center justify-center">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-seller-textprimary">
                {loading ? "..." : done.length}
                <span className="text-sm font-semibold text-seller-textsecondary">
                  {" "}
                  penarikan
                </span>
              </div>
              <div className="text-xs text-seller-textsecondary mt-1 font-tabular">
                Total {formatRupiah(doneTotal)}
              </div>
              <div className="text-[11px] text-seller-textsecondary mt-1.5">
                Sudah masuk ke rekening Anda
              </div>
            </div>
          </div>
        </div>

        {/* Baris utama: riwayat (kiri) + aturan & alur (kanan) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Riwayat Penarikan */}
          <div className="lg:col-span-8 bg-seller-surfacewhite border border-seller-hairline rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-seller-hairline flex items-center justify-between">
              <h3 className="text-base font-bold text-seller-textprimary">
                Riwayat Penarikan
              </h3>
              <span className="text-[10px] font-bold text-seller-textsecondary uppercase tracking-wider">
                {withdrawals.length} transaksi
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F9F8F6] text-[10px] font-bold text-seller-textsecondary uppercase tracking-wider border-b border-seller-hairline">
                  <tr>
                    <th className="px-5 py-3">Tanggal</th>
                    <th className="px-5 py-3">Nominal</th>
                    <th className="px-5 py-3">Rekening Tujuan</th>
                    <th className="px-5 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-seller-hairline bg-white">
                  {loading && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-5 py-8 text-center text-seller-textsecondary text-xs animate-pulse"
                      >
                        Memuat riwayat...
                      </td>
                    </tr>
                  )}
                  {!loading && withdrawals.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center">
                        <p className="text-sm font-bold text-seller-textprimary">
                          Belum ada penarikan
                        </p>
                        <p className="text-xs text-seller-textsecondary mt-1">
                          Saldo hasil penjualan bisa ditarik lewat tombol Tarik
                          Saldo.
                        </p>
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    withdrawals.map((w) => {
                      const { label, cls } = withdrawalStatusInfo(w.status);
                      return (
                        <tr
                          key={w.id}
                          className="hover:bg-seller-warmbg/30 transition-colors align-top"
                        >
                          <td className="px-5 py-4 text-xs text-seller-textsecondary whitespace-nowrap">
                            {formatDate(w.created_at)}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="font-bold text-seller-textprimary font-tabular">
                              {formatRupiah(w.amount)}
                            </div>
                            <div className="text-[11px] text-seller-textsecondary font-tabular">
                              Diterima{" "}
                              <span className="font-bold text-seller-semgreen">
                                {formatRupiah(w.net_amount)}
                              </span>
                              {Number(w.fee) > 0
                                ? ` · biaya ${formatRupiah(w.fee)}`
                                : ""}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-xs">
                            <div className="font-semibold text-seller-textprimary">
                              {w.bank_name}
                            </div>
                            <div className="text-seller-textsecondary">
                              {w.bank_account_number} a.n. {w.bank_account_name}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${cls}`}
                            >
                              {label}
                            </span>
                            {w.status === "ditolak" && w.admin_note && (
                              <p className="text-[10px] text-red-600 mt-1 max-w-[200px] ml-auto whitespace-normal">
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

          {/* Kolom kanan: ikut terbawa saat riwayat panjang di-scroll */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
            {/* Aturan penarikan */}
            <div className="bg-seller-surfacewhite border border-seller-hairline rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-seller-hairline">
                <h3 className="text-base font-bold text-seller-textprimary">
                  Aturan Penarikan
                </h3>
              </div>
              <div className="divide-y divide-seller-hairline">
                {rules.map((r) => (
                  <div
                    key={r.label}
                    className="px-5 py-3 flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="text-seller-textsecondary">{r.label}</span>
                    <span className="font-bold text-seller-textprimary font-tabular">
                      {r.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Alur penarikan */}
            <div className="bg-seller-surfacewhite border border-seller-hairline rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-seller-hairline">
                <h3 className="text-base font-bold text-seller-textprimary">
                  Alur Penarikan
                </h3>
              </div>
              <div className="p-5 space-y-4">
                {steps.map((s, i) => (
                  <div key={s.title} className="flex gap-3">
                    <div className="w-6 h-6 shrink-0 rounded-full bg-seller-primary-light text-seller-semgreen text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-seller-textprimary">
                        {s.title}
                      </div>
                      <div className="text-xs text-seller-textsecondary leading-relaxed">
                        {s.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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