"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wallet, QrCode, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { loadMidtransScript, openSnap } from "@/lib/midtrans";

const MIN_TOPUP = 10000; // samakan dengan validasi backend (min:10000)
const QUICK_AMOUNTS = [10000, 25000, 50000, 100000];

function formatRupiah(n: string | number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(n));
}

type Notice = { type: "error" | "info" | "success"; text: string };

export default function WalletContent() {
  const router = useRouter();

  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const fetchBalance = useCallback(async (): Promise<number | null> => {
    try {
      const res = await apiFetch("/wallet");
      if (!res.ok) return null;
      const json = await res.json();
      if (!json.success) return null;
      const value = Number(json.data?.balance ?? 0);
      setBalance(value);
      return value;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login?callbackUrl=/wallet");
      return;
    }
    fetchBalance().finally(() => setLoading(false));
  }, [router, fetchBalance]);

  // Saldo masuk lewat webhook Midtrans (asynchronous), jadi setelah Snap
  // selesai saldo dicek ulang beberapa kali sampai bertambah.
  const pollBalance = async (before: number) => {
    setSyncing(true);
    for (let i = 0; i < 6; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const now = await fetchBalance();
      if (now !== null && now > before) {
        setNotice({
          type: "success",
          text: "Top up berhasil. Saldo sudah bertambah.",
        });
        setSyncing(false);
        return;
      }
    }
    setNotice({
      type: "info",
      text: "Pembayaran sedang diproses. Saldo akan bertambah setelah konfirmasi dari Midtrans. Muat ulang halaman beberapa saat lagi.",
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-10 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-land-heading font-bold text-land-ink mb-1">
            Saldo Wallet
          </h1>
          <p className="text-sm text-land-muted">
            Isi saldo lewat QRIS, lalu pakai untuk membayar pesanan saat
            checkout.
          </p>
        </div>

        {/* Kartu saldo */}
        <div className="bg-[#009A44] rounded-[32px] p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2 text-white/80 text-xs font-bold uppercase tracking-wider mb-3">
            <Wallet className="w-4 h-4" />
            Saldo Tersedia
          </div>
          <div className="text-4xl sm:text-5xl font-bold tracking-tight font-tabular">
            {loading ? "..." : formatRupiah(balance ?? 0)}
          </div>
          {syncing && (
            <p className="text-xs text-white/80 mt-3 animate-pulse">
              Memeriksa saldo terbaru...
            </p>
          )}
        </div>

        {notice && (
          <div
            className={`rounded-2xl border px-5 py-4 text-sm font-medium ${noticeCls}`}
          >
            {notice.text}
          </div>
        )}

        {/* Form top up */}
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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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

        <Link
          href="/pesanan"
          className="block text-center text-sm font-bold text-[#009A44] hover:underline"
        >
          Lihat Riwayat Pesanan
        </Link>
      </div>
    </div>
  );
}