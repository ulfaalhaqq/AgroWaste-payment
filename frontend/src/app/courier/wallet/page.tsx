"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock, ShieldCheck, Upload, Wallet } from "lucide-react";
import { apiFetch, getProductImageUrl } from "@/lib/api";

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

interface CodShipment {
  id: string;
  status: string;
  cod_deposit_status: string | null;
  cod_proof_path: string | null;
  cod_deadline: string | null;
  cod_warned_at: string | null;
  order?: {
    id: string;
    order_number: string | null;
    total_price: string | number;
    user?: { name: string };
  };
}

interface AdminBank {
  bank_name?: string;
  account_number?: string;
  account_name?: string;
}

// ---- Aturan bisnis penarikan (samakan dengan .env backend) ----
const MIN_WITHDRAWAL = 20000;
const WITHDRAWAL_COOLDOWN_HOURS = 24;
const WITHDRAWAL_FEE = 2500;
// Backend hanya menghitung penarikan berstatus ini untuk jeda 24 jam
// dan penarikan gratis pertama tiap bulan (yang "ditolak" tidak dihitung).
const COUNTED_STATUSES = ["pending", "diproses", "selesai"];
const MAX_PROOF_BYTES = 2 * 1024 * 1024; // backend: image|max:2048 (2 MB)

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

function withdrawalStatusInfo(status: Withdrawal["status"]) {
  switch (status) {
    case "pending":
      return { label: "MENUNGGU", cls: "bg-amber-100 text-amber-700" };
    case "diproses":
      return { label: "DIPROSES", cls: "bg-blue-100 text-blue-700" };
    case "selesai":
      return { label: "SELESAI", cls: "bg-green-100 text-green-700" };
    case "ditolak":
      return { label: "DITOLAK", cls: "bg-red-100 text-red-700" };
    default:
      return { label: status, cls: "bg-[#EAE6E1] text-courier-textsecondary" };
  }
}

function codStatusInfo(status: string | null) {
  switch (status) {
    case "menunggu_setor":
      return { label: "MENUNGGU SETOR", cls: "bg-amber-100 text-amber-800" };
    case "menunggu_verifikasi":
      return { label: "MENUNGGU VERIFIKASI", cls: "bg-blue-100 text-blue-700" };
    case "selesai":
      return { label: "SELESAI", cls: "bg-green-100 text-green-700" };
    default:
      return {
        label: status ?? "-",
        cls: "bg-[#EAE6E1] text-courier-textsecondary",
      };
  }
}

function deadlineInfo(deadline: string | null) {
  if (!deadline) return null;
  const diffMs = new Date(deadline).getTime() - Date.now();
  const hours = Math.max(1, Math.ceil(Math.abs(diffMs) / 3600000));
  return diffMs < 0
    ? { late: true, text: `Terlambat ${hours} jam` }
    : { late: false, text: `Sisa ${hours} jam` };
}

const COD_SORT: Record<string, number> = {
  menunggu_setor: 0,
  menunggu_verifikasi: 1,
  selesai: 2,
};

function sumTotal(list: CodShipment[]) {
  return list.reduce((acc, s) => acc + Number(s.order?.total_price ?? 0), 0);
}

export default function CourierWalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [shipments, setShipments] = useState<CodShipment[]>([]);
  const [adminBank, setAdminBank] = useState<AdminBank | null>(null);
  const [loading, setLoading] = useState(true);

  // Penarikan saldo
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Setoran COD
  const [depositTarget, setDepositTarget] = useState<CodShipment | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [depositing, setDepositing] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [depositNotice, setDepositNotice] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const [walletRes, shipmentRes, bankRes] = await Promise.all([
      apiFetch("/wallet")
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      apiFetch("/logistik/shipments")
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      apiFetch("/config/admin-bank")
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]);

    if (walletRes?.success) setWallet(walletRes.data as WalletData);
    if (shipmentRes?.success && Array.isArray(shipmentRes.data)) {
      setShipments(shipmentRes.data as CodShipment[]);
    }
    if (bankRes?.success) setAdminBank(bankRes.data as AdminBank);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ---------- Setoran COD ----------
  const codShipments = shipments
    .filter((s) => s.cod_deposit_status)
    .sort(
      (a, b) =>
        (COD_SORT[a.cod_deposit_status as string] ?? 9) -
        (COD_SORT[b.cod_deposit_status as string] ?? 9),
    );

  const waitingList = codShipments.filter(
    (s) => s.cod_deposit_status === "menunggu_setor",
  );
  const verifyingList = codShipments.filter(
    (s) => s.cod_deposit_status === "menunggu_verifikasi",
  );
  const warnedCount = waitingList.filter((s) => s.cod_warned_at).length;

  const nearestDeadline = waitingList
    .filter((s) => s.cod_deadline)
    .sort(
      (a, b) =>
        new Date(a.cod_deadline as string).getTime() -
        new Date(b.cod_deadline as string).getTime(),
    )[0];
  const nearestInfo = nearestDeadline
    ? deadlineInfo(nearestDeadline.cod_deadline)
    : null;

  const openDepositModal = (s: CodShipment) => {
    setDepositTarget(s);
    setProofFile(null);
    setDepositError(null);
  };

  const closeDepositModal = () => {
    setDepositTarget(null);
    setProofFile(null);
    setDepositError(null);
  };

  const handleUploadProof = async () => {
    if (!depositTarget) return;
    setDepositError(null);

    if (!proofFile) {
      setDepositError("Pilih foto bukti setoran terlebih dahulu.");
      return;
    }
    if (proofFile.size > MAX_PROOF_BYTES) {
      setDepositError("Ukuran foto maksimal 2 MB.");
      return;
    }

    setDepositing(true);
    try {
      const formData = new FormData();
      formData.append("proof_image", proofFile);

      const res = await apiFetch(
        `/logistik/shipments/${depositTarget.id}/cod-proof`,
        { method: "POST", body: formData },
      );
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        setDepositError(
          json?.message ?? "Gagal mengunggah bukti setoran. Coba lagi.",
        );
        return;
      }

      closeDepositModal();
      setDepositNotice(
        "Bukti setoran terkirim. Menunggu verifikasi admin sebelum dana dicairkan.",
      );
      await fetchAll();
    } catch {
      setDepositError("Tidak dapat terhubung ke server.");
    } finally {
      setDepositing(false);
    }
  };

  // ---------- Penarikan saldo ----------
  const resetForm = () => {
    setAmount("");
    setBankName("");
    setBankAccountNumber("");
    setBankAccountName("");
    setFormError(null);
  };

  const countedWithdrawals = (wallet?.withdrawals ?? []).filter((w) =>
    COUNTED_STATUSES.includes(w.status),
  );

  const getLastWithdrawal = (): Withdrawal | null => {
    if (countedWithdrawals.length === 0) return null;
    return [...countedWithdrawals].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0];
  };

  const withdrawalCountThisMonth = countedWithdrawals.filter((w) => {
    const d = new Date(w.created_at);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    );
  }).length;

  const isNextWithdrawalFree = withdrawalCountThisMonth === 0;
  // Hanya estimasi tampilan; fee final dihitung backend.
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
    if (numericAmount < MIN_WITHDRAWAL) {
      setFormError(`Minimal penarikan adalah ${formatRupiah(MIN_WITHDRAWAL)}.`);
      return;
    }
    if (wallet && numericAmount > wallet.balance) {
      setFormError(
        `Saldo Anda tidak mencukupi. Saldo tersedia: ${formatRupiah(wallet.balance)}.`,
      );
      return;
    }

    const last = getLastWithdrawal();
    if (last) {
      const hoursSinceLast =
        (Date.now() - new Date(last.created_at).getTime()) / (1000 * 60 * 60);
      if (hoursSinceLast < WITHDRAWAL_COOLDOWN_HOURS) {
        const remaining = Math.ceil(WITHDRAWAL_COOLDOWN_HOURS - hoursSinceLast);
        setFormError(
          `Anda baru bisa menarik saldo lagi dalam ${remaining} jam (jeda minimal 24 jam antar penarikan).`,
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
      fetchAll();
      setIsSuccessModalOpen(true);
    } catch {
      setFormError("Tidak dapat terhubung ke server.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "w-full px-3 py-2 bg-courier-warmbg border border-courier-hairline rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-courier-primary text-courier-textprimary";

  const rules = [
    { label: "Minimal penarikan", value: formatRupiah(MIN_WITHDRAWAL) },
    { label: "Penarikan pertama tiap bulan", value: "Gratis" },
    { label: "Biaya penarikan berikutnya", value: formatRupiah(WITHDRAWAL_FEE) },
    { label: "Jeda antar penarikan", value: `${WITHDRAWAL_COOLDOWN_HOURS} jam` },
  ];

  return (
    <>
      <div className="space-y-6 pb-20">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-courier-textprimary mb-1">
            Wallet Kurir
          </h2>
          <p className="text-sm text-courier-textsecondary">
            Kelola saldo ongkir, setoran uang COD, dan penarikan ke rekening
            bank Anda.
          </p>
        </div>

        {/* Baris ringkasan: saldo (2 kolom) + 2 kartu statistik */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Saldo */}
          <div className="col-span-2 bg-courier-primary rounded-2xl p-6 text-white relative overflow-hidden shadow-lg shadow-courier-primary/20 flex flex-col sm:flex-row sm:items-stretch justify-between gap-6">
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white opacity-5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex flex-col justify-between gap-5 relative">
              <div>
                <span className="flex items-center gap-2 text-xs font-bold text-white/70 uppercase tracking-wider mb-2">
                  <Wallet className="w-4 h-4" />
                  Saldo Tersedia
                </span>
                <span className="text-4xl xl:text-5xl font-bold tracking-tight block">
                  {loading ? "..." : formatRupiah(wallet?.balance ?? 0)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="self-start px-6 py-3 bg-white text-courier-primary rounded-xl font-bold text-sm shadow-sm hover:bg-gray-50 transition-colors"
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
                <span className="text-lg font-bold">
                  {isNextWithdrawalFree ? "Gratis" : formatRupiah(estimatedFee)}
                </span>
              </div>
            </div>
          </div>

          {/* Perlu disetor */}
          <div className="bg-courier-surfacewhite border border-courier-hairline rounded-2xl p-5 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-courier-textsecondary uppercase tracking-wider">
                Perlu Disetor
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-courier-textprimary">
                {loading ? "..." : waitingList.length}
              </div>
              <div className="text-xs text-courier-textsecondary mt-1">
                Total {formatRupiah(sumTotal(waitingList))}
              </div>
              {nearestInfo && nearestDeadline && (
                <div
                  className={`text-[11px] font-bold mt-1.5 ${nearestInfo.late ? "text-red-600" : "text-amber-700"}`}
                >
                  Tenggat terdekat: {nearestInfo.text}
                </div>
              )}
            </div>
          </div>

          {/* Menunggu verifikasi */}
          <div className="bg-courier-surfacewhite border border-courier-hairline rounded-2xl p-5 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-courier-textsecondary uppercase tracking-wider">
                Menunggu Verifikasi
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-courier-textprimary">
                {loading ? "..." : verifyingList.length}
              </div>
              <div className="text-xs text-courier-textsecondary mt-1">
                Total {formatRupiah(sumTotal(verifyingList))}
              </div>
              <div className="text-[11px] text-courier-textsecondary mt-1.5">
                Dicek admin sebelum dana cair
              </div>
            </div>
          </div>
        </div>

        {/* Baris utama: setoran COD (kiri) + aturan & riwayat (kanan) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Setoran COD */}
          <div className="lg:col-span-7 bg-courier-surfacewhite border border-courier-hairline rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-courier-hairline flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-courier-textprimary">
                  Setoran Uang COD
                </h3>
                <p className="text-xs text-courier-textsecondary mt-0.5">
                  Uang tunai dari pembeli COD wajib disetor ke rekening admin
                  maksimal 1 hari setelah pembeli mengonfirmasi pesanan
                  diterima.
                </p>
              </div>
              {waitingList.length > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-amber-500 text-white text-[10px] font-bold shrink-0">
                  {waitingList.length} perlu setor
                </span>
              )}
            </div>

            <div className="p-5 space-y-4">
              {depositNotice && (
                <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-xs text-green-800 font-semibold flex justify-between gap-3">
                  <span>{depositNotice}</span>
                  <button
                    type="button"
                    onClick={() => setDepositNotice(null)}
                    className="font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}

              {warnedCount > 0 && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700 font-semibold">
                  Admin sudah mengirim peringatan untuk {warnedCount} setoran
                  yang terlambat. Segera setor, atau akun Anda dapat disuspend.
                </div>
              )}

              {adminBank && (
                <div className="rounded-xl bg-courier-warmbg/60 border border-courier-hairline px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="text-[10px] font-bold text-courier-textsecondary uppercase tracking-wider">
                    Rekening Tujuan Setoran (Admin)
                  </span>
                  <span className="text-sm font-bold text-courier-textprimary sm:text-right">
                    {adminBank.bank_name} · {adminBank.account_number}
                    <span className="block text-xs font-normal text-courier-textsecondary">
                      a.n. {adminBank.account_name}
                    </span>
                  </span>
                </div>
              )}

              {loading && (
                <div className="py-8 text-center text-xs text-courier-textsecondary animate-pulse">
                  Memuat data setoran...
                </div>
              )}

              {!loading && codShipments.length === 0 && (
                <div className="rounded-xl border-2 border-dashed border-courier-hairline px-6 py-8 text-center">
                  <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-courier-warmbg text-courier-primary flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold text-courier-textprimary">
                    Belum ada setoran COD
                  </p>
                  <p className="text-xs text-courier-textsecondary mt-1 leading-relaxed">
                    Tugas setor muncul setelah pembeli mengonfirmasi pesanan COD
                    yang Anda antar.
                  </p>
                </div>
              )}

              {!loading &&
                codShipments.map((s) => {
                  const { label, cls } = codStatusInfo(s.cod_deposit_status);
                  const dl =
                    s.cod_deposit_status === "menunggu_setor"
                      ? deadlineInfo(s.cod_deadline)
                      : null;
                  const orderNo =
                    s.order?.order_number ?? s.id.slice(0, 8).toUpperCase();

                  return (
                    <div
                      key={s.id}
                      className="border border-courier-hairline rounded-xl p-4 bg-white grid grid-cols-1 sm:grid-cols-12 gap-4 sm:items-center"
                    >
                      <div className="sm:col-span-4 min-w-0">
                        <div className="font-bold text-courier-textprimary truncate">
                          #{orderNo}
                        </div>
                        <div className="text-xs text-courier-textsecondary truncate">
                          Pembeli: {s.order?.user?.name ?? "-"}
                        </div>
                        <span
                          className={`inline-block mt-2 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${cls}`}
                        >
                          {label}
                        </span>
                      </div>

                      <div className="sm:col-span-4">
                        <span className="block text-[10px] font-bold text-courier-textsecondary uppercase tracking-wider">
                          Nominal Disetor
                        </span>
                        <span className="text-lg font-bold text-courier-textprimary">
                          {formatRupiah(s.order?.total_price ?? 0)}
                        </span>
                        {dl && (
                          <span
                            className={`block text-[11px] font-bold ${dl.late ? "text-red-600" : "text-amber-700"}`}
                          >
                            {dl.text}
                            {s.cod_deadline
                              ? ` · ${formatDate(s.cod_deadline)}`
                              : ""}
                          </span>
                        )}
                      </div>

                      <div className="sm:col-span-4 flex flex-col gap-2 sm:items-end">
                        {s.cod_deposit_status === "menunggu_setor" && (
                          <button
                            type="button"
                            onClick={() => openDepositModal(s)}
                            className="w-full sm:w-auto px-4 py-2 bg-courier-primary hover:bg-green-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            Unggah Bukti
                          </button>
                        )}
                        {s.cod_deposit_status === "menunggu_verifikasi" && (
                          <span className="text-[11px] text-courier-textsecondary sm:text-right">
                            Menunggu admin memeriksa bukti.
                          </span>
                        )}
                        {s.cod_proof_path && (
                          <a
                            href={getProductImageUrl(s.cod_proof_path)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-courier-primary hover:underline"
                          >
                            Lihat bukti
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Kolom kanan */}
          <div className="lg:col-span-5 space-y-6">
            {/* Aturan penarikan */}
            <div className="bg-courier-surfacewhite border border-courier-hairline rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-courier-hairline">
                <h3 className="text-base font-bold text-courier-textprimary">
                  Aturan Penarikan
                </h3>
              </div>
              <div className="divide-y divide-courier-hairline">
                {rules.map((r) => (
                  <div
                    key={r.label}
                    className="px-5 py-3 flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="text-courier-textsecondary">{r.label}</span>
                    <span className="font-bold text-courier-textprimary">
                      {r.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Riwayat penarikan */}
            <div className="bg-courier-surfacewhite border border-courier-hairline rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-courier-hairline flex items-center justify-between">
                <h3 className="text-base font-bold text-courier-textprimary">
                  Riwayat Penarikan
                </h3>
                <span className="text-[10px] font-bold text-courier-textsecondary uppercase tracking-wider">
                  {wallet?.withdrawals?.length ?? 0} transaksi
                </span>
              </div>

              <div className="max-h-[420px] overflow-y-auto divide-y divide-courier-hairline">
                {loading && (
                  <div className="px-5 py-8 text-center text-xs text-courier-textsecondary animate-pulse">
                    Memuat riwayat...
                  </div>
                )}

                {!loading &&
                  (!wallet?.withdrawals || wallet.withdrawals.length === 0) && (
                    <div className="px-5 py-8 text-center">
                      <p className="text-sm font-bold text-courier-textprimary">
                        Belum ada penarikan
                      </p>
                      <p className="text-xs text-courier-textsecondary mt-1">
                        Saldo yang sudah masuk bisa ditarik kapan saja lewat
                        tombol Tarik Saldo.
                      </p>
                    </div>
                  )}

                {!loading &&
                  wallet?.withdrawals.map((w) => {
                    const { label, cls } = withdrawalStatusInfo(w.status);
                    return (
                      <div
                        key={w.id}
                        className="px-5 py-4 flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="text-[11px] text-courier-textsecondary">
                            {formatDate(w.created_at)}
                          </div>
                          <div className="font-bold text-courier-textprimary">
                            {formatRupiah(w.amount)}
                          </div>
                          <div className="text-[11px] text-courier-textsecondary">
                            Diterima {formatRupiah(w.net_amount)}
                            {Number(w.fee) > 0
                              ? ` · biaya ${formatRupiah(w.fee)}`
                              : ""}
                          </div>
                          <div className="text-[11px] text-courier-textsecondary truncate">
                            {w.bank_name} · {w.bank_account_number} a.n.{" "}
                            {w.bank_account_name}
                          </div>
                          {w.status === "ditolak" && w.admin_note && (
                            <p className="text-[11px] text-red-600 mt-1">
                              {w.admin_note}
                            </p>
                          )}
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider shrink-0 ${cls}`}
                        >
                          {label}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Tarik Saldo */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-courier-surfacewhite w-full max-w-md rounded-2xl border border-courier-hairline overflow-hidden animate-fade-in flex flex-col max-h-[92vh]">
            <div className="p-4 border-b border-courier-hairline flex justify-between items-center shrink-0">
              <h3 className="font-bold text-courier-textprimary">Tarik Saldo</h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="text-courier-textsecondary hover:text-courier-textprimary"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <p className="text-xs text-courier-textsecondary leading-relaxed">
                Minimal penarikan Rp 20.000. Penarikan pertama tiap bulan
                gratis, penarikan berikutnya dikenakan biaya admin Rp 2.500.
                Jeda minimal 24 jam antar penarikan.
              </p>

              <div
                className={`px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between ${
                  isNextWithdrawalFree
                    ? "bg-emerald-50 text-green-700 border border-emerald-100"
                    : "bg-amber-50 text-amber-700 border border-amber-100"
                }`}
              >
                <span>
                  {isNextWithdrawalFree
                    ? "Penarikan ini GRATIS (penarikan ke-1 bulan ini)"
                    : `Penarikan ke-${withdrawalCountThisMonth + 1} bulan ini`}
                </span>
                <span>
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
                <label className="block text-xs font-semibold text-courier-textsecondary mb-1">
                  Nominal Penarikan
                </label>
                <input
                  type="number"
                  min={MIN_WITHDRAWAL}
                  placeholder="Minimal Rp 20.000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={inputCls}
                />
                {wallet && (
                  <p className="text-[10px] text-courier-textsecondary mt-1">
                    Saldo tersedia: {formatRupiah(wallet.balance)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-courier-textsecondary mb-1">
                  Nama Bank
                </label>
                <input
                  type="text"
                  placeholder="Contoh: BCA, Mandiri, BRI"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-courier-textsecondary mb-1">
                  Nomor Rekening
                </label>
                <input
                  type="text"
                  placeholder="1234567890"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-courier-textsecondary mb-1">
                  Nama Pemilik Rekening
                </label>
                <input
                  type="text"
                  placeholder="Sesuai buku tabungan"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="p-4 border-t border-courier-hairline flex justify-end gap-3 bg-[#F9F8F6] shrink-0">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold text-courier-textsecondary hover:text-courier-textprimary disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleSubmitWithdraw}
                disabled={submitting}
                className="px-4 py-2 bg-courier-primary hover:bg-green-800 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-60"
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
          <div className="bg-courier-surfacewhite w-full max-w-sm rounded-3xl border border-courier-hairline p-8 text-center space-y-4 animate-fade-in shadow-xl">
            <h3 className="text-xl font-bold text-courier-textprimary">
              Pengajuan Terkirim
            </h3>
            <p className="text-sm text-courier-textsecondary leading-relaxed">
              Permintaan penarikan Anda sedang menunggu persetujuan admin.
              Proses ini biasanya memakan waktu hingga 1x24 jam.
            </p>
            <button
              onClick={() => setIsSuccessModalOpen(false)}
              className="w-full mt-4 py-3 bg-courier-primary hover:bg-green-800 text-white rounded-xl text-sm font-bold transition-colors"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}

      {/* Modal Unggah Bukti Setoran COD */}
      {depositTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-courier-surfacewhite w-full max-w-md rounded-2xl border border-courier-hairline overflow-hidden animate-fade-in">
            <div className="p-4 border-b border-courier-hairline flex justify-between items-center">
              <h3 className="font-bold text-courier-textprimary">
                Unggah Bukti Setoran COD
              </h3>
              <button
                onClick={closeDepositModal}
                disabled={depositing}
                className="text-courier-textsecondary hover:text-courier-textprimary"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="rounded-xl bg-courier-warmbg/50 border border-courier-hairline px-4 py-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-courier-textsecondary">Pesanan</span>
                  <span className="font-bold text-courier-textprimary">
                    #
                    {depositTarget.order?.order_number ??
                      depositTarget.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-courier-textsecondary">
                    Nominal disetor
                  </span>
                  <span className="font-bold text-courier-textprimary">
                    {formatRupiah(depositTarget.order?.total_price ?? 0)}
                  </span>
                </div>
                {adminBank && (
                  <div className="flex justify-between gap-3">
                    <span className="text-courier-textsecondary">
                      Rekening admin
                    </span>
                    <span className="font-bold text-courier-textprimary text-right">
                      {adminBank.bank_name} {adminBank.account_number}
                      <br />
                      <span className="font-normal">
                        a.n. {adminBank.account_name}
                      </span>
                    </span>
                  </div>
                )}
              </div>

              {depositError && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-semibold">
                  {depositError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-courier-textsecondary mb-1">
                  Foto Bukti Transfer (maks. 2 MB)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-courier-primary/10 file:text-courier-primary hover:file:bg-courier-primary/20"
                />
                {proofFile && (
                  <p className="text-xs text-courier-primary mt-2 font-semibold">
                    File dipilih: {proofFile.name}
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-courier-hairline flex justify-end gap-3 bg-[#F9F8F6]">
              <button
                onClick={closeDepositModal}
                disabled={depositing}
                className="px-4 py-2 text-xs font-bold text-courier-textsecondary hover:text-courier-textprimary disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleUploadProof}
                disabled={depositing}
                className="px-4 py-2 bg-courier-primary hover:bg-green-800 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-60"
              >
                {depositing ? "Mengunggah..." : "Kirim Bukti"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}