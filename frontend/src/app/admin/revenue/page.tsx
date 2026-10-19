"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDownLeft, Percent, RefreshCw, Wallet } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface RevenueRow {
  id: string;
  source: string;
  amount: string | number;
  created_at: string;
  order?: {
    id: string;
    order_number?: string | null;
    metode_pembayaran?: string | null;
  } | null;
  withdrawal?: {
    id: string;
    amount?: string | number;
  } | null;
  user?: {
    name?: string;
    role?: string;
  } | null;
}

interface MonthlyItem {
  month: string; // "YYYY-MM"
  transaction_fee: number;
  withdrawal_fee: number;
}

interface RevenueData {
  total: number;
  transaction_fee: number;
  withdrawal_fee: number;
  other: number;
  transaction_count: number;
  withdrawal_count: number;
  this_month: number;
  monthly: MonthlyItem[];
  recent: RevenueRow[];
}

type Tab = "Semua" | "Fee Transaksi" | "Biaya Penarikan";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

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

function sourceInfo(source: string) {
  switch (source) {
    case "transaction_fee":
      return { label: "Fee Transaksi", cls: "bg-blue-100 text-blue-700" };
    case "withdrawal_fee":
      return { label: "Biaya Penarikan", cls: "bg-amber-100 text-amber-700" };
    default:
      return { label: source, cls: "bg-gray-100 text-gray-600" };
  }
}

function monthLabel(m: string) {
  const idx = Number(m.slice(5, 7)) - 1;
  return MONTH_NAMES[idx] ?? m;
}

function roleLabel(role?: string) {
  switch (role) {
    case "peternak":
      return "Peternak";
    case "logistik":
      return "Kurir";
    case "pembeli":
      return "Pembeli";
    default:
      return role ?? "";
  }
}

export default function AdminRevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("Semua");

  const fetchAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await apiFetch("/admin/platform-revenue");
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success || !json.data) {
        setError(json?.message ?? "Gagal memuat data pendapatan platform.");
        return;
      }
      setData(json.data as RevenueData);
      setError(null);
    } catch {
      setError("Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const total = data?.total ?? 0;
  const txFee = data?.transaction_fee ?? 0;
  const wdFee = data?.withdrawal_fee ?? 0;
  const txPct = total > 0 ? Math.round((txFee / total) * 100) : 0;
  const wdPct = total > 0 ? Math.round((wdFee / total) * 100) : 0;

  const monthly = data?.monthly ?? [];
  const maxMonth = Math.max(
    ...monthly.map((m) => m.transaction_fee + m.withdrawal_fee),
    0,
  );

  const rows = (data?.recent ?? []).filter((r) => {
    if (tab === "Fee Transaksi") return r.source === "transaction_fee";
    if (tab === "Biaya Penarikan") return r.source === "withdrawal_fee";
    return true;
  });

  const tabs: { label: Tab; count: number }[] = [
    { label: "Semua", count: data?.recent.length ?? 0 },
    {
      label: "Fee Transaksi",
      count: (data?.recent ?? []).filter((r) => r.source === "transaction_fee")
        .length,
    },
    {
      label: "Biaya Penarikan",
      count: (data?.recent ?? []).filter((r) => r.source === "withdrawal_fee")
        .length,
    },
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-1">
            Pendapatan Platform
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Keuntungan AgroWaste dari fee transaksi dan biaya penarikan saldo.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchAll}
          disabled={refreshing}
          className="self-start sm:self-auto px-4 py-2 bg-white hover:bg-gray-50 border border-black/10 text-gray-800 font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition-colors disabled:opacity-60"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-admin-primary ${refreshing ? "animate-spin" : ""}`}
          />
          Perbarui Data
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* Ringkasan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="col-span-2 bg-admin-primary rounded-2xl p-6 text-white relative overflow-hidden shadow-lg flex flex-col sm:flex-row sm:items-stretch justify-between gap-6">
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative flex flex-col justify-between gap-2">
            <span className="flex items-center gap-2 text-xs font-bold text-white/70 uppercase tracking-wider">
              <Wallet className="w-4 h-4" />
              Total Pendapatan Platform
            </span>
            <span className="text-4xl xl:text-5xl font-bold tracking-tight font-tabular block">
              {loading ? "..." : formatRupiah(total)}
            </span>
            <span className="text-xs text-white/80">
              Seluruh fee yang tercatat sejak awal
            </span>
          </div>
          <div className="relative grid grid-cols-2 sm:grid-cols-1 gap-3 sm:min-w-[180px]">
            <div className="bg-white/10 rounded-xl px-4 py-3 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
                Bulan ini
              </span>
              <span className="text-lg font-bold font-tabular">
                {loading ? "..." : formatRupiah(data?.this_month ?? 0)}
              </span>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-3 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
                Jumlah pencatatan
              </span>
              <span className="text-lg font-bold">
                {loading
                  ? "..."
                  : (data?.transaction_count ?? 0) +
                    (data?.withdrawal_count ?? 0)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-black/10 rounded-2xl p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Fee Transaksi
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 font-tabular">
              {loading ? "..." : formatRupiah(txFee)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Dari {data?.transaction_count ?? 0} transaksi
            </div>
          </div>
        </div>

        <div className="bg-white border border-black/10 rounded-2xl p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Biaya Penarikan
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 font-tabular">
              {loading ? "..." : formatRupiah(wdFee)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Dari {data?.withdrawal_count ?? 0} penarikan berbiaya
            </div>
          </div>
        </div>
      </div>

      {/* Grafik + komposisi */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 bg-white border border-black/10 rounded-2xl p-5 sm:p-6 flex flex-col">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Pendapatan 6 Bulan Terakhir
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Gabungan fee transaksi dan biaya penarikan per bulan.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-semibold text-gray-600 shrink-0">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                Transaksi
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
                Penarikan
              </span>
            </div>
          </div>

          <div className="flex-1 flex items-end justify-between gap-2 sm:gap-4 h-56 border-b border-black/10 pb-2">
            {loading && (
              <div className="w-full text-center text-xs text-gray-500 animate-pulse self-center">
                Memuat grafik...
              </div>
            )}
            {!loading &&
              monthly.map((m) => {
                const sum = m.transaction_fee + m.withdrawal_fee;
                const height =
                  maxMonth > 0 && sum > 0
                    ? Math.max(6, Math.round((sum / maxMonth) * 100))
                    : 0;
                const txShare = sum > 0 ? (m.transaction_fee / sum) * 100 : 0;
                return (
                  <div
                    key={m.month}
                    className="flex-1 h-full flex flex-col items-center justify-end gap-1.5"
                    title={`${monthLabel(m.month)}: ${formatRupiah(sum)}`}
                  >
                    <span className="text-[10px] font-bold text-gray-500 font-tabular">
                      {sum > 0 ? formatRupiah(sum) : ""}
                    </span>
                    {height > 0 ? (
                      <div
                        className="w-full max-w-[56px] rounded-t-lg overflow-hidden flex flex-col-reverse"
                        style={{ height: `${height}%` }}
                      >
                        <div
                          className="bg-blue-500 w-full"
                          style={{ height: `${txShare}%` }}
                        />
                        <div
                          className="bg-amber-400 w-full"
                          style={{ height: `${100 - txShare}%` }}
                        />
                      </div>
                    ) : (
                      <div className="w-full max-w-[56px] h-[3px] bg-gray-200 rounded-full" />
                    )}
                  </div>
                );
              })}
          </div>
          <div className="flex justify-between gap-2 sm:gap-4 pt-2">
            {monthly.map((m) => (
              <div
                key={m.month}
                className="flex-1 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wider"
              >
                {monthLabel(m.month)}
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-black/10 rounded-2xl p-5 sm:p-6 flex flex-col gap-5">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Komposisi Pendapatan
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Proporsi tiap sumber terhadap total.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-gray-700">
                  Fee Transaksi
                </span>
                <span className="font-bold text-gray-900">{txPct}%</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${txPct}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-gray-700">
                  Biaya Penarikan
                </span>
                <span className="font-bold text-gray-900">{wdPct}%</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full"
                  style={{ width: `${wdPct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-auto rounded-xl bg-gray-50 border border-black/5 px-4 py-3 space-y-2.5 text-xs">
            <div className="flex gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              <span className="text-gray-600 leading-relaxed">
                <b className="text-gray-900">Fee transaksi:</b> persentase dari
                subtotal produk, dicatat saat pesanan sukses. Persentasenya
                diatur lewat <span className="font-mono">.env</span>.
              </span>
            </div>
            <div className="flex gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
              <span className="text-gray-600 leading-relaxed">
                <b className="text-gray-900">Biaya penarikan:</b> dipungut pada
                penarikan kedua dan seterusnya dalam sebulan. Dibatalkan kalau
                penarikan ditolak.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Riwayat */}
      <div className="bg-white border border-black/10 rounded-2xl overflow-hidden">
        <div className="px-5 pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Riwayat Pendapatan
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              100 pencatatan terbaru.
            </p>
          </div>
        </div>

        <div className="flex border-b border-black/10 overflow-x-auto px-3 mt-3">
          {tabs.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => setTab(t.label)}
              className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 flex items-center gap-2 transition-colors ${
                tab === t.label
                  ? "border-admin-primary text-admin-primary"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {t.label}
              <span
                className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                  tab === t.label
                    ? "bg-admin-primary text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-black/10">
              <tr>
                <th className="px-5 py-3">Tanggal</th>
                <th className="px-5 py-3">Sumber</th>
                <th className="px-5 py-3">Referensi</th>
                <th className="px-5 py-3">Pengguna</th>
                <th className="px-5 py-3 text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {loading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-xs text-gray-500 animate-pulse"
                  >
                    Memuat riwayat...
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <p className="text-sm font-bold text-gray-900">
                      Belum ada pendapatan tercatat
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Fee muncul di sini setelah ada transaksi sukses atau
                      penarikan berbiaya.
                    </p>
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((r) => {
                  const { label, cls } = sourceInfo(r.source);
                  const reference = r.order?.order_number
                    ? `#${r.order.order_number}`
                    : r.withdrawal
                      ? `Penarikan ${formatRupiah(r.withdrawal.amount ?? 0)}`
                      : "-";
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(r.created_at)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider whitespace-nowrap ${cls}`}
                        >
                          {label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-mono text-gray-700 whitespace-nowrap">
                        {reference}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-700">
                        {r.user?.name ?? "-"}
                        {r.user?.role && (
                          <span className="text-gray-400">
                            {" "}
                            · {roleLabel(r.user.role)}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-green-700 font-tabular whitespace-nowrap">
                        +{formatRupiah(r.amount)}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}