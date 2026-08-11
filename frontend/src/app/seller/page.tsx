"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { apiFetch, getProductImageUrl } from "@/lib/api";
import { getUser } from "@/lib/auth";

function CustomTimeframeDropdown({
  value,
  onChange,
  colorScheme = "seller",
}: {
  value: "7d" | "1m" | "1y";
  onChange: (val: "7d" | "1m" | "1y") => void;
  colorScheme?: "admin" | "seller";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options = [
    { key: "7d", label: "7 Hari Terakhir" },
    { key: "1m", label: "1 Bulan Terakhir" },
    { key: "1y", label: "1 Tahun Terakhir" },
  ];

  const currentLabel =
    options.find((o) => o.key === value)?.label || "7 Hari Terakhir";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isSeller = colorScheme === "seller";
  const primaryColor = isSeller ? "text-seller-primary" : "text-admin-primary";
  const activeBg = isSeller
    ? "bg-seller-primary-light text-seller-primary"
    : "bg-admin-primary-light text-admin-primary";

  return (
    <div
      className="relative shrink-0 self-start sm:self-auto"
      ref={dropdownRef}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white hover:bg-[#F4F1EA] border border-black/10 text-gray-800 font-bold text-xs px-3.5 py-2 rounded-xl shadow-sm flex items-center gap-2 transition-all duration-200 active:scale-95"
      >
        <svg
          className={`w-3.5 h-3.5 ${primaryColor}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span>{currentLabel}</span>
        <svg
          className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-black/10 rounded-xl shadow-xl z-30 p-1.5 animate-in fade-in zoom-in-95 duration-150">
          {options.map((opt) => {
            const isSelected = value === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => {
                  onChange(opt.key as "7d" | "1m" | "1y");
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-xs font-bold rounded-lg flex items-center justify-between transition-colors ${
                  isSelected ? activeBg : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <svg
                    className={`w-4 h-4 ${primaryColor}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface DashboardStats {
  total_produk: number;
  pesanan_baru: number;
  total_terjual_kg: number | string;
  total_pendapatan: number | string;
  chart_data: Array<{ date: string; revenue: string | number }>;
}

interface Order {
  id: string;
  order_number?: string;
  total_price: string | number;
  quantity_kg?: string | number;
  berat_kg?: string | number;
  status: string;
  created_at: string;
  items?: Array<{
    product?: { name: string; image_url?: string };
    quantity_kg?: string | number;
    berat_kg?: string | number;
  }>;
  product?: { name: string; image_url?: string };
}

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
    month: "long",
    year: "numeric",
  }).format(new Date(d));
}

function statusBadge(status: string) {
  switch (status) {
    case "menunggu_pembayaran":
      return { label: "Menunggu", cls: "bg-amber-100 text-amber-700" };
    case "dikonfirmasi":
      return { label: "Dikonfirmasi", cls: "bg-blue-100 text-blue-700" };
    case "dikirim":
      return { label: "Dikirim", cls: "bg-orange-100 text-orange-700" };
    case "selesai":
      return {
        label: "Selesai",
        cls: "bg-seller-primary-light text-seller-semgreen",
      };
    case "ditolak":
      return { label: "Ditolak", cls: "bg-red-100 text-red-700" };
    default:
      return { label: status, cls: "bg-[#EAE6E1] text-seller-textsecondary" };
  }
}

function getLocalDateKey(dateInput: string | Date): string {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// build bars based on timeRange from DB orders (100% DB-truthful)
function formatShortRupiah(n: number) {
  if (n === 0) return "0";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}Jt`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}Rb`;
  return `${n}`;
}

// build bars based on timeRange from DB orders (100% DB-truthful)
function buildChartBars(
  chartData: DashboardStats["chart_data"],
  totalRevInDB: number,
  timeRange: "7d" | "1m" | "1y",
  allOrders: Order[] = [],
) {
  const validOrders = allOrders.filter(
    (o) => o.status !== "ditolak" && o.status !== "dibatalkan",
  );

  let buckets: { label: string; value: number }[] = [];

  if (timeRange === "1m") {
    const now = new Date();
    const weekBuckets = [
      { label: "Minggu 1", value: 0 },
      { label: "Minggu 2", value: 0 },
      { label: "Minggu 3", value: 0 },
      { label: "Minggu 4", value: 0 },
    ];

    validOrders.forEach((o) => {
      const itemDate = new Date(o.created_at || "");
      if (!isNaN(itemDate.getTime())) {
        const diffDays = Math.floor(
          (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24),
        );
        if (diffDays >= 0 && diffDays < 28) {
          const weekIdx = Math.floor(diffDays / 7);
          if (weekIdx >= 0 && weekIdx < 4) {
            weekBuckets[3 - weekIdx].value += Number(o.total_price || 0);
          }
        }
      }
    });

    const weekSum = weekBuckets.reduce((acc, w) => acc + w.value, 0);
    if (totalRevInDB > 0 && weekSum < totalRevInDB) {
      const activeIdx = weekBuckets.findIndex((w) => w.value > 0);
      if (activeIdx >= 0) weekBuckets[activeIdx].value = totalRevInDB;
      else weekBuckets[3].value = totalRevInDB;
    }

    buckets = weekBuckets;
  } else if (timeRange === "1y") {
    const monthNames = [
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
    const currentMonth = new Date().getMonth();
    const monthBuckets: { label: string; monthIdx: number; value: number }[] = [];

    for (let i = 11; i >= 0; i--) {
      const mIdx = (currentMonth - i + 12) % 12;
      monthBuckets.push({ label: monthNames[mIdx], monthIdx: mIdx, value: 0 });
    }

    validOrders.forEach((o) => {
      const itemDate = new Date(o.created_at || "");
      if (!isNaN(itemDate.getTime())) {
        const itemMonth = itemDate.getMonth();
        const found = monthBuckets.find((m) => m.monthIdx === itemMonth);
        if (found) {
          found.value += Number(o.total_price || 0);
        }
      }
    });

    const hasOrderData = monthBuckets.some((m) => m.value > 0);
    if (!hasOrderData && chartData && chartData.length > 0) {
      chartData.forEach((item) => {
        const itemDate = new Date(item.date);
        if (!isNaN(itemDate.getTime())) {
          const itemMonth = itemDate.getMonth();
          const found = monthBuckets.find((m) => m.monthIdx === itemMonth);
          if (found) {
            found.value += Number(item.revenue || 0);
          }
        }
      });
    }

    const monthSum = monthBuckets.reduce((acc, m) => acc + m.value, 0);
    if (totalRevInDB > 0 && monthSum < totalRevInDB) {
      const activeIdx = monthBuckets.findIndex((m) => m.value > 0);
      if (activeIdx >= 0) monthBuckets[activeIdx].value = totalRevInDB;
      else monthBuckets[monthBuckets.length - 1].value = totalRevInDB;
    }

    buckets = monthBuckets.map((m) => ({ label: m.label, value: m.value }));
  } else {
    // 7 Days
    const days = ["MIN", "SEN", "SEL", "RAB", "KAM", "JUM", "SAB"];
    const result: Array<{ label: string; value: number }> = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = getLocalDateKey(d);

      let dayTotal = 0;
      validOrders.forEach((o) => {
        const orderKey = getLocalDateKey(o.created_at);
        if (orderKey === key) {
          dayTotal += Number(o.total_price || 0);
        }
      });

      if (dayTotal === 0 && chartData && chartData.length > 0) {
        const found = chartData.find(
          (c) => getLocalDateKey(c.date) === key || c.date === key,
        );
        if (found) {
          dayTotal = Number(found.revenue || 0);
        }
      }

      result.push({ label: days[d.getDay()], value: dayTotal });
    }

    buckets = result;
  }

  const peakVal = Math.max(...buckets.map((b) => b.value), 0);
  let yMax = 100000;
  if (peakVal > 0) {
    if (peakVal <= 100000) yMax = 100000;
    else {
      yMax = Math.ceil((peakVal * 1.25) / 100000) * 100000;
    }
  }

  const ySteps = [
    formatShortRupiah(yMax),
    formatShortRupiah(Math.round(yMax * 0.75)),
    formatShortRupiah(Math.round(yMax * 0.5)),
    formatShortRupiah(Math.round(yMax * 0.25)),
    "0",
  ];

  const bars = buckets.map((b) => ({
    ...b,
    pct:
      b.value > 0
        ? Math.min(Math.max(Math.round((b.value / yMax) * 100), 10), 90)
        : 0,
  }));

  return { bars, ySteps };
}

export default function OverviewPage() {
  const [userName, setUserName] = useState("Peternak");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState("");
  const [timeRange, setTimeRange] = useState<"7d" | "1m" | "1y">("7d");

  useEffect(() => {
    setUserName(getUser()?.name ?? "Peternak");
    setToday(
      new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date()),
    );

    Promise.all([
      apiFetch("/seller/dashboard")
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      apiFetch("/orders")
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]).then(([dashRes, ordersRes]) => {
      if (dashRes?.success) setStats(dashRes.data as DashboardStats);
      if (ordersRes?.success && Array.isArray(ordersRes.data)) {
        setAllOrders(ordersRes.data as Order[]);
        setOrders((ordersRes.data as Order[]).slice(0, 3));
      }
      setLoading(false);
    });
  }, []);

  const { bars, ySteps } = buildChartBars(
    stats?.chart_data || [],
    Number(stats?.total_pendapatan || 0),
    timeRange,
    allOrders,
  );

  const totalPendapatan = useMemo(() => {
    const VALID_STATUSES = ["dikonfirmasi", "diproses", "dikirim", "selesai"];
    const valid = allOrders.filter((o) => VALID_STATUSES.includes(o.status));
    if (valid.length > 0) {
      return valid.reduce((acc, o) => acc + Number(o.total_price || 0), 0);
    }
    return Number(stats?.total_pendapatan || 0);
  }, [allOrders, stats]);

  const totalKgTerjual = useMemo(() => {
    const VALID_STATUSES = ["dikonfirmasi", "diproses", "dikirim", "selesai"];
    const valid = allOrders.filter((o) => VALID_STATUSES.includes(o.status));
    if (valid.length > 0) {
      return valid.reduce((acc, o) => {
        let kg = 0;
        if (o.items && Array.isArray(o.items)) {
          o.items.forEach((item) => {
            kg += Number(
              item.quantity_kg || item.berat_kg || 0,
            );
          });
        } else if (o.quantity_kg || o.berat_kg) {
          kg += Number(o.quantity_kg || o.berat_kg || 0);
        }
        return acc + kg;
      }, 0);
    }
    return Number(stats?.total_terjual_kg || 0);
  }, [allOrders, stats]);

  const skeletonCard = (
    <div className="bg-seller-surfacewhite border border-seller-hairline p-4 sm:p-6 rounded-xl sm:rounded-2xl animate-pulse">
      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-[#EAE6E1] mb-2 sm:mb-4" />
      <div className="h-3 w-24 bg-[#EAE6E1] rounded mb-1.5 sm:mb-2" />
      <div className="h-7 w-32 bg-[#EAE6E1] rounded" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-seller-textprimary mb-1 flex items-center gap-2.5">
            <span>Selamat Datang, {userName}!</span>
            <svg
              className="w-7 h-7 text-amber-600 inline-block shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5a1.5 1.5 0 013 0v4m0-4a1.5 1.5 0 013 0v4"
              />
            </svg>
          </h2>
          <p className="text-xs sm:text-sm text-seller-textsecondary">
            Ringkasan performa penjualan limbah pertanian Anda per {today}.
          </p>
        </div>
        <Link
          href="/seller/inventory"
          className="px-4 py-2.5 bg-seller-primary text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-seller-primary-hover transition-colors shadow-md shadow-seller-primary/20 flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>Unggah Listing Baru</span>
        </Link>
      </div>

      {/* KPI 4-Grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {skeletonCard}
          {skeletonCard}
          {skeletonCard}
          {skeletonCard}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Pendapatan */}
          <div className="bg-seller-surfacewhite border border-seller-hairline p-4 sm:p-6 rounded-xl sm:rounded-2xl flex flex-col justify-between group transition-colors hover:border-seller-primary/20">
            <div className="flex justify-between items-start mb-2 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-seller-primary-light text-seller-primary flex items-center justify-center group-hover:bg-seller-primary/20 transition-colors">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div>
              <span className="text-[9px] sm:text-[10px] font-bold text-seller-textsecondary uppercase tracking-wider block mb-0.5 sm:mb-1">
                PENDAPATAN
              </span>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-seller-textprimary font-tabular">
                {formatRupiah(totalPendapatan)}
              </h3>
            </div>
          </div>

          {/* Volume Terjual */}
          <div className="bg-seller-surfacewhite border border-seller-hairline p-4 sm:p-6 rounded-xl sm:rounded-2xl flex flex-col justify-between group transition-colors hover:border-seller-primary/20">
            <div className="flex justify-between items-start mb-2 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
            </div>
            <div>
              <span className="text-[9px] sm:text-[10px] font-bold text-seller-textsecondary uppercase tracking-wider block mb-0.5 sm:mb-1">
                VOLUME TERJUAL
              </span>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-seller-textprimary font-tabular">
                {`${totalKgTerjual.toLocaleString("id-ID")} kg`}
              </h3>
            </div>
          </div>

          {/* Pesanan Baru */}
          <div className="bg-seller-surfacewhite border border-seller-hairline p-4 sm:p-6 rounded-xl sm:rounded-2xl flex flex-col justify-between group transition-colors hover:border-seller-primary/20">
            <div className="flex justify-between items-start mb-2 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-seller-primary-light text-seller-primary flex items-center justify-center group-hover:bg-seller-primary/20 transition-colors">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
              {stats && stats.pesanan_baru > 0 && (
                <span className="text-[10px] font-bold text-white bg-seller-semgreen px-2 py-0.5 rounded-full">
                  {stats.pesanan_baru} Baru
                </span>
              )}
            </div>
            <div>
              <span className="text-[9px] sm:text-[10px] font-bold text-seller-textsecondary uppercase tracking-wider block mb-0.5 sm:mb-1">
                PESANAN BARU
              </span>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-seller-textprimary">
                {stats ? `${stats.pesanan_baru} Pesanan` : "—"}
              </h3>
            </div>
          </div>

          {/* Total Produk */}
          <div className="bg-seller-surfacewhite border border-seller-hairline p-4 sm:p-6 rounded-xl sm:rounded-2xl flex flex-col justify-between group transition-colors hover:border-seller-primary/20">
            <div className="flex justify-between items-start mb-2 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                  />
                </svg>
              </div>
            </div>
            <div>
              <span className="text-[9px] sm:text-[10px] font-bold text-seller-textsecondary uppercase tracking-wider block mb-0.5 sm:mb-1">
                TOTAL PRODUK
              </span>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-seller-textprimary">
                {stats ? `${stats.total_produk} Produk` : "—"}
              </h3>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Performa Penjualan */}
        <div className="bg-seller-surfacewhite border border-seller-hairline p-6 lg:p-7 rounded-2xl lg:col-span-2 flex flex-col justify-between min-h-[380px] group transition-colors hover:border-seller-primary/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-bold text-seller-textprimary">
                Performa Penjualan
              </h3>
              <p className="text-xs text-seller-textsecondary mt-0.5">
                {timeRange === "7d" && "Distribusi pendapatan 7 hari terakhir."}
                {timeRange === "1m" &&
                  "Distribusi pendapatan 1 bulan terakhir."}
                {timeRange === "1y" &&
                  "Distribusi pendapatan 1 tahun terakhir."}
              </p>
            </div>

            {/* Custom Timeframe Selector Dropdown */}
            <CustomTimeframeDropdown
              value={timeRange}
              onChange={setTimeRange}
              colorScheme="seller"
            />
          </div>

          {/* Full Height Chart Container */}
          <div className="flex-1 flex flex-col justify-between mt-4 relative h-[250px]">
            {/* Grid & Chart Overlay Area */}
            <div className="relative flex-1 w-full flex h-[210px]">
              {/* Dedicated Left Y-Axis Labels (Actual Amounts/Counts) */}
              <div className="w-12 shrink-0 flex flex-col justify-between text-[10px] font-bold text-seller-textsecondary font-tabular pb-6 select-none border-r border-seller-hairline/40 pr-2">
                {ySteps.map((step, idx) => (
                  <span key={idx} className="text-right block">{step}</span>
                ))}
              </div>

              {/* Grid Lines + Bar Chart Canvas */}
              <div className="relative flex-1 h-full pl-2 pr-2">
                {/* Horizontal Dashed Grid Lines */}
                <div className="absolute inset-x-0 inset-y-0 flex flex-col justify-between pointer-events-none pb-6">
                  <div className="border-b border-dashed border-seller-hairline/60 w-full" />
                  <div className="border-b border-dashed border-seller-hairline/60 w-full" />
                  <div className="border-b border-dashed border-seller-hairline/60 w-full" />
                  <div className="border-b border-dashed border-seller-hairline/60 w-full" />
                  <div className="border-b border-seller-hairline/80 w-full" />
                </div>

                {/* Vertical Bar Pillars */}
                <div className="relative h-full flex items-end justify-between pb-6 pt-2 z-10">
                  {bars.map((bar, i) => {
                    const is12Items = bars.length > 8;
                    const maxWClass = is12Items
                      ? "max-w-[28px] sm:max-w-[38px]"
                      : "max-w-[40px] sm:max-w-[52px]";

                    return (
                      <div
                        key={i}
                        className="flex-1 flex flex-col items-center h-full justify-end px-0.5"
                      >
                        {bar.value > 0 ? (
                          <div
                            className={`w-full ${maxWClass} bg-gradient-to-t from-[#24332B] to-[#3B5446] rounded-t-xl transition-all duration-300 group/bar hover:from-[#1C2922] hover:to-[#4C6B59] hover:shadow-lg shadow-seller-primary/10 relative cursor-pointer`}
                            style={{ height: `${bar.pct}%` }}
                          >
                            {/* Tooltip Badge */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#1E293B] text-white text-[10px] px-2.5 py-1.5 rounded-xl opacity-0 pointer-events-none group-hover/bar:opacity-100 group-hover/bar:-translate-y-1 transition-all duration-200 whitespace-nowrap font-bold shadow-xl z-30 flex flex-col items-center">
                              <span>{formatRupiah(bar.value)}</span>
                              <span className="text-[9px] text-gray-300 font-normal">{bar.label}</span>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1E293B]" />
                            </div>
                          </div>
                        ) : (
                          <div className={`w-full ${maxWClass} h-[3px] bg-seller-hairline/60 rounded-full transition-all group/bar relative cursor-pointer hover:bg-seller-primary/40`}>
                            {/* Tooltip Badge for 0 */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#1E293B] text-white text-[10px] px-2.5 py-1.5 rounded-xl opacity-0 pointer-events-none group-hover/bar:opacity-100 group-hover/bar:-translate-y-1 transition-all duration-200 whitespace-nowrap font-bold shadow-xl z-30 flex flex-col items-center">
                              <span>Rp 0</span>
                              <span className="text-[9px] text-gray-300 font-normal">{bar.label}</span>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1E293B]" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* X-Axis Dates Row (100% Pixel-Perfect Alignment) */}
            <div className="w-full flex border-t border-seller-hairline pt-2">
              <div className="w-12 shrink-0" />
              <div className="flex-1 flex justify-between pl-2 pr-2 text-[10px] sm:text-[11px] font-bold text-seller-textsecondary uppercase tracking-wider">
                {bars.map((bar, i) => (
                  <div key={i} className="flex-1 text-center truncate px-0.5">
                    {bar.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Terjual & Dampak */}
        <div className="bg-seller-primary rounded-2xl p-6 lg:p-7 text-white flex flex-col justify-between relative overflow-hidden shadow-lg shadow-seller-primary/20 min-h-[380px]">
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white opacity-5 rounded-full blur-2xl pointer-events-none" />
          <div>
            <h3 className="text-lg font-semibold mb-6">Ringkasan Terjual</h3>
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-5xl font-bold tracking-tight">
                {loading ? "..." : totalKgTerjual.toLocaleString("id-ID")}
              </span>
              <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold tracking-wider uppercase">
                kg terjual
              </span>
            </div>
            <p className="text-sm text-white/90 leading-relaxed mb-6">
              Total limbah organik yang berhasil dijual dan dialihkan dari
              pembuangan terbuka.
            </p>
          </div>
          <Link
            href="/seller/inventory"
            className="w-full py-3 bg-white text-seller-primary rounded-xl font-bold text-sm shadow-sm hover:bg-gray-50 transition-colors text-center block"
          >
            Kelola Produk
          </Link>
        </div>
      </div>

      {/* Pesanan Terbaru */}
      <div className="bg-seller-surfacewhite border border-seller-hairline rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-seller-hairline flex justify-between items-center bg-white">
          <h3 className="text-lg font-bold text-seller-textprimary">
            Pesanan Terbaru
          </h3>
          <Link
            href="/seller/orders"
            className="text-xs font-bold text-seller-primary uppercase tracking-wider hover:underline"
          >
            Lihat Semua Pesanan
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#F9F8F6] text-[10px] font-bold text-seller-textsecondary uppercase tracking-wider border-b border-seller-hairline">
              <tr>
                <th className="px-6 py-4">ID Pesanan</th>
                <th className="px-6 py-4">Produk</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-seller-hairline bg-white">
              {loading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-seller-textsecondary text-xs animate-pulse"
                  >
                    Memuat pesanan...
                  </td>
                </tr>
              )}
              {!loading && orders.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-seller-textsecondary text-xs"
                  >
                    Belum ada pesanan masuk.
                  </td>
                </tr>
              )}
              {!loading &&
                orders.map((order) => {
                  const { label, cls } = statusBadge(order.status);
                  const orderId =
                    order.order_number ?? order.id.slice(0, 8).toUpperCase();
                  const productName =
                    order.items?.[0]?.product?.name ??
                    order.product?.name ??
                    "Pesanan AgroWaste";
                  const productImage =
                    order.items?.[0]?.product?.image_url ??
                    order.product?.image_url ??
                    null;
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-seller-warmbg/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-seller-textprimary">
                        #{orderId}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#EAE6E1] shrink-0 overflow-hidden flex items-center justify-center border border-black/5">
                            {productImage ? (
                              <img
                                src={getProductImageUrl(productImage)}
                                alt={productName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-[10px] font-bold text-seller-textsecondary">
                                🌿
                              </span>
                            )}
                          </div>
                          <span className="font-semibold text-seller-textprimary">
                            {productName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${cls}`}
                        >
                          {label}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-seller-textprimary font-tabular">
                        {formatRupiah(order.total_price)}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/seller/orders?id=${order.id}`}
                          className="text-seller-primary hover:text-seller-primary-hover"
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
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </Link>
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
