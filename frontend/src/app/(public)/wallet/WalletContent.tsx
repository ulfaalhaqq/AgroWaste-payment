"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Wallet,
  QrCode,
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  ShoppingBag,
  RefreshCw,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { loadMidtransScript, openSnap } from "@/lib/midtrans";

const MIN_TOPUP = 10000;
const QUICK_AMOUNTS = [10000, 25000, 50000, 100000];

function formatRupiah(n: string | number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(n));
}

function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Notice = { type: "error" | "info" | "success"; text: string };

type WalletTransaction = {
  id: string | number;
  type: "topup" | "expense" | "credit" | "debit" | string;
  amount: number;
  description?: string;
  created_at: string;
  status?: string;
};

export default function WalletContent() {
  const router = useRouter();

  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false); // State khusus loading tombol refresh
  const [notice, setNotice] = useState<Notice | null>(null);

  // State mutasi wallet murni
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchBalanceAndHistory = useCallback(async (): Promise<number | null> => {
    try {
      // 1. Fetch Saldo Wallet
      const resWallet = await apiFetch("/wallet");
      let currentBalance: number | null = null;

      if (resWallet.ok) {
        const jsonWallet = await resWallet.json();
        if (jsonWallet.success) {
          currentBalance = Number(jsonWallet.data?.balance ?? 0);
          setBalance(currentBalance);
          
          // Jika API /wallet membalas transaksi mutasi dalam data wallet-nya
          if (Array.isArray(jsonWallet.data?.transactions)) {
            setTransactions(jsonWallet.data.transactions);
          }
        }
      }

      // 2. Fetch Mutasi Murni Wallet (Endpoint khusus mutasi saldo/wallet_transactions)
      const resHistory = await apiFetch("/wallet/transactions");
      if (resHistory.ok) {
        const jsonHistory = await resHistory.json();
        if (jsonHistory.success && Array.isArray(jsonHistory.data)) {
          setTransactions(jsonHistory.data);
        }
      }

      return currentBalance;
    } catch {
      return null;
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login?callbackUrl=/wallet");
      return;
    }
    fetchBalanceAndHistory().finally(() => setLoading(false));
  }, [router, fetchBalanceAndHistory]);

  // Handler khusus untuk tombol Perbarui Data
  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchBalanceAndHistory();
    setRefreshing(false);
  };

  const pollBalance = async (before: number) => {
    setSyncing(true);
    for (let i = 0; i < 6; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const now = await fetchBalanceAndHistory();
      if (now !== null && now > before) {
        setNotice({
          type: "success",
          text: "Top up berhasil. Saldo telah diperbarui.",
        });
        setSyncing(false);
        return;
      }
    }
    setNotice({
      type: "info",
      text: "Pembayaran sedang diproses. Saldo akan bertambah setelah konfirmasi Midtrans.",
    });
    setSyncing(false);
  };

  const handleTopUp = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);

    const nominal = Number(amount);
    if (!nominal || nominal < MIN_TOPUP) {
      setNotice({
        type: "error",
        text: `Minimal top up ${formatRupiah(MIN_TOPUP)}.`,
      });
      return;
    }

    setSubmitting(true);
    const before = balance ?? 0;

    try {
      const res = await apiFetch("/wallet/topup", {
        method: "POST",
        body: JSON.stringify({ amount: nominal }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setNotice({
          type: "error",
          text: json.message ?? "Gagal membuat sesi top up.",
        });
        setSubmitting(false);
        return;
      }

      await loadMidtransScript();

      openSnap(json.data.snap_token as string, {
        onSuccess: () => {
          setAmount("");
          setSubmitting(false);
          setNotice({
            type: "info",
            text: "Pembayaran diterima. Menunggu konfirmasi saldo...",
          });
          pollBalance(before);
        },
        onPending: () => {
          setSubmitting(false);
          setNotice({
            type: "info",
            text: "Menunggu pembayaran QRIS diselesaikan...",
          });
          pollBalance(before);
        },
        onError: () => {
          setSubmitting(false);
          setNotice({
            type: "error",
            text: "Pembayaran gagal diproses. Silakan coba lagi.",
          });
        },
        onClose: () => {
          setSubmitting(false);
          setNotice({ type: "info", text: "Top up dibatalkan." });
        },
      });
    } catch {
      setNotice({
        type: "error",
        text: "Tidak dapat terhubung ke server. Coba lagi.",
      });
      setSubmitting(false);
    }
  };

  const noticeCls =
    notice?.type === "error"
      ? "bg-red-50 border-red-200 text-red-700"
      : notice?.type === "success"
      ? "bg-[#E6F5EC] border-[#009A44]/30 text-[#00662D]"
      : "bg-amber-50 border-amber-200 text-amber-800";

  return (
    <div className="flex-1 animate-fade-in pb-24 bg-land-bg">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-land-heading font-bold text-land-ink mb-1">
              Saldo & Mutasi Wallet
            </h1>
            <p className="text-sm text-land-muted">
              Isi saldo dan pantau khusus mutasi kredit & debit saldo wallet Anda.
            </p>
          </div>
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="self-start sm:self-auto flex items-center gap-2 text-xs font-bold text-[#009A44] bg-white border border-[#E8E0D5] px-4 py-2.5 rounded-xl hover:bg-[#E6F5EC]/50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing || syncing ? "animate-spin" : ""}`} />
            {refreshing ? "Memperbarui..." : "Perbarui Data"}
          </button>
        </div>

        {notice && (
          <div
            className={`rounded-2xl border px-5 py-4 text-sm font-medium ${noticeCls}`}
          >
            {notice.text}
          </div>
        )}

        {/* Grid Layout Utama */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Kolom Kiri: Kartu Saldo & Form Top Up (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Kartu Saldo */}
            <div className="bg-[#009A44] rounded-[32px] p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-2 text-white/80 text-xs font-bold uppercase tracking-wider mb-3">
                <Wallet className="w-4 h-4" />
                Saldo Tersedia
              </div>
              <div className="text-3xl sm:text-4xl font-bold tracking-tight font-tabular">
                {loading ? "..." : formatRupiah(balance ?? 0)}
              </div>
              {syncing && (
                <p className="text-xs text-white/80 mt-3 animate-pulse">
                  Memeriksa saldo terbaru...
                </p>
              )}
            </div>

            {/* Form Top Up */}
            <form
              onSubmit={handleTopUp}
              className="bg-white border border-[#E8E0D5]/60 rounded-[32px] p-6 sm:p-8 shadow-sm space-y-5"
            >
              <div className="flex items-center gap-2.5">
                <QrCode className="w-5 h-5 text-[#009A44]" />
                <h2 className="text-xl font-bold text-land-ink font-land-heading">
                  Top Up via QRIS
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {QUICK_AMOUNTS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setAmount(String(n))}
                    className={`py-2.5 rounded-xl text-xs font-bold border-2 transition-colors ${
                      Number(amount) === n
                        ? "bg-[#E6F5EC]/50 border-[#009A44] text-[#009A44]"
                        : "bg-white border-[#E8E0D5]/60 text-land-ink hover:border-land-clay"
                    }`}
                  >
                    {formatRupiah(n)}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-land-muted uppercase tracking-wider mb-2">
                  Nominal Top Up
                </label>
                <input
                  type="number"
                  min={MIN_TOPUP}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Minimal ${formatRupiah(MIN_TOPUP)}`}
                  className="block w-full rounded-2xl border border-[#E8E0D5] py-3.5 px-4 text-[#111111] placeholder:text-gray-400 focus:ring-2 focus:ring-[#009A44] focus:border-[#009A44] text-sm bg-[#F0EDE6]/20"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-clay-primary py-3.5 w-full flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting ? "Memproses..." : "Top Up Sekarang"}
                {!submitting && <ArrowRight className="w-5 h-5" />}
              </button>
            </form>
          </div>

          {/* Kolom Kanan: Riwayat Mutasi Saldo Wallet (7 Cols) */}
          <div className="lg:col-span-7 bg-white border border-[#E8E0D5]/60 rounded-[32px] p-6 sm:p-8 shadow-sm flex flex-col min-h-[520px]">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E0D5]/60 mb-4">
              <div className="flex items-center gap-2.5">
                <History className="w-5 h-5 text-[#009A44]" />
                <h2 className="text-xl font-bold text-land-ink font-land-heading">
                  Riwayat Mutasi Saldo
                </h2>
              </div>
              <Link
                href="/pesanan"
                className="text-xs font-bold text-[#009A44] hover:underline flex items-center gap-1"
              >
                Riwayat Pesanan
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* List Riwayat Mutasi Wallet */}
            <div className="flex-1 overflow-y-auto max-h-[480px] space-y-3 pr-1">
              {loadingHistory ? (
                <div className="py-12 text-center text-sm text-land-muted">
                  Memuat riwayat mutasi...
                </div>
              ) : transactions.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#F0EDE6] flex items-center justify-center mx-auto text-land-muted">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-land-muted">
                    Belum ada riwayat top up atau pengeluaran dari wallet.
                  </p>
                </div>
              ) : (
                transactions.map((item) => {
                  const isTopup =
                    item.type === "topup" ||
                    item.type === "credit" ||
                    item.type === "in";

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 rounded-2xl border border-[#E8E0D5]/40 hover:bg-[#F0EDE6]/30 transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isTopup
                              ? "bg-[#E6F5EC] text-[#009A44]"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {isTopup ? (
                            <ArrowDownLeft className="w-5 h-5" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5" />
                          )}
                        </div>

                        <div className="space-y-0.5">
                          <p className="text-sm font-bold text-land-ink line-clamp-1">
                            {isTopup ? "Top Up Saldo" : "Pembayaran Pesanan"}
                          </p>
                          <p className="text-xs text-land-muted">
                            {formatDate(item.created_at)}
                          </p>
                          {item.description && (
                            <p className="text-[11px] text-gray-500 line-clamp-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-3">
                        <p
                          className={`text-sm font-bold font-tabular ${
                            isTopup ? "text-[#009A44]" : "text-land-ink"
                          }`}
                        >
                          {isTopup ? "+" : "-"}
                          {formatRupiah(item.amount)}
                        </p>
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase mt-1 ${
                            isTopup
                              ? "bg-[#E6F5EC] text-[#00662D]"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {isTopup ? "Kredit" : "Debit"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}