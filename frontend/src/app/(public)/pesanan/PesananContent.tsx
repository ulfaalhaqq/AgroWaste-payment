"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  MapPin,
  CheckCircle2,
  SlidersHorizontal,
  Leaf,
  Receipt,
  Truck,
  Clock,
  XCircle,
  Star,
} from "lucide-react";
import { apiFetch, getProductImageUrl } from "@/lib/api";
import { getToken, logout } from "@/lib/auth";
import { ReviewItem } from "@/types/order";

interface OrderProduct {
  id: string;
  name: string;
  price: string;
  unit: string;
  image_url?: string | null;
}

interface OrderItem {
  product_id?: string;
  quantity_kg: string | number;
  price_per_kg: string | number;
  product: OrderProduct;
}

interface Order {
  id: string;
  order_number?: string;
  total_price: string | number;
  quantity_kg?: string | number;
  status: string;
  metode_pengiriman?: string;
  created_at: string;
  product?: OrderProduct;
  items?: OrderItem[];
  reviews?: ReviewItem[];
  shipment?: { status: string } | null;
}

// Sidebar status filter options
const STATUS_FILTERS = [
  { label: "Semua Status", value: "" },
  { label: "Menunggu Pembayaran", value: "menunggu_pembayaran" },
  { label: "Sedang Diproses", value: "dikonfirmasi" },
  { label: "Sedang Dikirim", value: "dikirim" },
  { label: "Selesai", value: "selesai" },
];

function formatRupiah(n: string | number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(n));
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

interface StatusMeta {
  label: string;
  Icon: React.ElementType;
  color: string;
  bg: string;
}

function statusMeta(status: string): StatusMeta {
  switch (status) {
    case "menunggu_pembayaran":
      return {
        label: "Menunggu Pembayaran",
        Icon: Clock,
        color: "text-amber-600",
        bg: "bg-amber-100",
      };
    case "dikonfirmasi":
      return {
        label: "Dikonfirmasi",
        Icon: CheckCircle2,
        color: "text-blue-600",
        bg: "bg-blue-100",
      };
    case "dikirim":
      return {
        label: "Sedang Dikirim",
        Icon: Truck,
        color: "text-amber-600",
        bg: "bg-amber-100",
      };
    case "selesai":
      return {
        label: "Selesai",
        Icon: CheckCircle2,
        color: "text-[#009A44]",
        bg: "bg-[#009A44]/10",
      };
    case "ditolak":
      return {
        label: "Ditolak",
        Icon: XCircle,
        color: "text-red-600",
        bg: "bg-red-100",
      };
    default:
      return {
        label: "Menunggu",
        Icon: Clock,
        color: "text-amber-600",
        bg: "bg-amber-100",
      };
  }
}

export default function PesananContent() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [timeFilter, setTimeFilter] = useState("semua");
  const [confirmLoadingId, setConfirmLoadingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const handleConfirmReceipt = async (orderId: string) => {
    if (!window.confirm("Yakin barang sudah diterima?")) {
      return;
    }
    setConfirmLoadingId(orderId);
    try {
      const res = await apiFetch(`/orders/${orderId}/complete`, {
        method: "PUT",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.message ?? "Gagal mengonfirmasi penerimaan barang.");
      } else {
        alert("Pesanan berhasil diselesaikan.");
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: "selesai" } : o)),
        );
      }
    } catch {
      alert("Tidak dapat terhubung ke server.");
    } finally {
      setConfirmLoadingId(null);
    }
  };

  useEffect(() => {
    if (!getToken()) {
      router.push("/login?callbackUrl=/pesanan");
      return;
    }
    apiFetch("/orders")
      .then((res) => {
        if (res.status === 401) {
          logout();
          router.push("/login?callbackUrl=/pesanan");
          return null;
        }
        if (!res.ok) throw new Error("Gagal memuat riwayat pesanan.");
        return res.json();
      })
      .then((json) => {
        if (!json) return;
        setOrders(Array.isArray(json.data) ? json.data : []);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [router]);

  // filter: search, status, time
  const visibleOrders = useMemo(() => {
    return orders.filter((order) => {
      if (statusFilter && order.status !== statusFilter) return false;

      // search across order_number and all product names
      const q = searchInput.trim().toLowerCase();
      if (q) {
        const idText = (order.order_number ?? order.id).toLowerCase();
        const productNames = [
          order.product?.name ?? "",
          ...(order.items?.map((i) => i.product?.name ?? "") ?? []),
        ]
          .join(" ")
          .toLowerCase();
        if (!idText.includes(q) && !productNames.includes(q)) return false;
      }

      if (timeFilter !== "semua") {
        const orderDate = new Date(order.created_at).getTime();
        const now = new Date().getTime();
        const diffMs = now - orderDate;
        if (timeFilter === "30days") {
          const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
          if (diffMs > thirtyDaysMs || diffMs < 0) return false;
        } else if (timeFilter === "3months") {
          const threeMonthsMs = 90 * 24 * 60 * 60 * 1000;
          if (diffMs > threeMonthsMs || diffMs < 0) return false;
        } else if (timeFilter === "year") {
          const orderYear = new Date(order.created_at).getFullYear();
          const currentYear = new Date().getFullYear();
          if (orderYear !== currentYear) return false;
        }
      }

      return true;
    });
  }, [orders, searchInput, statusFilter, timeFilter]);

  return (
    <div className="flex-1 animate-fade-in pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Hero Section & Search Bar */}
        <section className="bg-[#1C231F] rounded-[32px] px-6 py-10 md:py-12 mt-6 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-md">
          <div className="absolute top-0 left-0 w-64 h-64 bg-[#009A44] rounded-full mix-blend-screen filter blur-[100px] opacity-20 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#4ADE80] rounded-full mix-blend-screen filter blur-[100px] opacity-10 pointer-events-none" />

          <h1
            className="text-3xl md:text-4xl font-land-heading font-bold text-white mb-8 relative z-10"
            style={{ textWrap: "balance" }}
          >
            Pantau <span className="text-[#4ADE80]">Pesanan</span> Anda.
          </h1>

          <div className="w-full max-w-3xl relative z-20 group">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari ID Pesanan atau nama produk..."
              className="w-full h-16 md:h-20 pl-11 sm:pl-14 md:pl-16 pr-24 sm:pr-32 md:pr-40 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/60 text-sm sm:text-base md:text-xl focus:outline-none focus:bg-white/20 focus:border-[#4ADE80] transition-all shadow-[0_8px_32px_rgba(0,0,0,0.15)]"
            />
            <Search className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white/60 absolute left-4 sm:left-5 md:left-6 top-1/2 -translate-y-1/2 group-focus-within:text-[#4ADE80] transition-colors pointer-events-none" />

            <button
              type="button"
              className="absolute right-2 top-2 bottom-2 px-4 sm:px-6 md:px-10 bg-[#009A44] hover:bg-[#008139] text-white rounded-full font-bold text-xs sm:text-sm md:text-lg transition-transform hover:scale-105 shadow-md flex items-center justify-center"
            >
              Cari
            </button>
          </div>
        </section>

        {/* Main Layout: Sidebar & List */}
        <div className="lg:hidden mt-6 flex justify-between items-center gap-4">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex-1 py-3.5 bg-white border border-[#E8E0D5] rounded-full text-sm font-bold text-land-ink hover:border-land-accent transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {showFilters ? "Sembunyikan Filter" : "Tampilkan Filter"}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 mt-6 lg:mt-12">
          {/* Left Sidebar (Filter) */}
          <div
            className={`w-full lg:w-1/4 shrink-0 ${showFilters ? "block" : "hidden lg:block"} flex flex-col gap-4 lg:gap-6`}
          >
            <div className="bg-white border border-[#E8E0D5] rounded-2xl lg:rounded-[32px] p-4 lg:p-8 shadow-[0_8px_24px_rgba(44,57,48,0.04)] sticky top-24">
              <div className="hidden lg:flex items-center gap-3 mb-6 pb-6 border-b border-[#E8E0D5]">
                <SlidersHorizontal className="w-5 h-5 text-land-ink" />
                <h2 className="font-land-heading font-bold text-xl text-land-ink">
                  Filter
                </h2>
              </div>

              {/* Status filter — controlled */}
              <div className="mb-5 lg:mb-8">
                <h3 className="font-bold text-xs lg:text-sm text-land-ink mb-3 lg:mb-4 uppercase tracking-wider">
                  Status
                </h3>
                <div className="space-y-3 lg:space-y-4">
                  {STATUS_FILTERS.map((sf) => (
                    <label
                      key={sf.value}
                      className="flex items-center gap-2.5 lg:gap-3 cursor-pointer group"
                    >
                      <input
                        type="radio"
                        name="status"
                        checked={statusFilter === sf.value}
                        onChange={() => setStatusFilter(sf.value)}
                        className="w-4 h-4 lg:w-5 lg:h-5 border-[#E8E0D5] text-[#009A44] focus:ring-[#009A44] transition-colors cursor-pointer"
                      />
                      <span
                        className={`text-sm lg:text-base font-medium transition-colors group-hover:text-land-ink ${
                          statusFilter === sf.value
                            ? "text-[#009A44] font-semibold"
                            : "text-land-muted"
                        }`}
                      >
                        {sf.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Waktu Beli */}
              <div className="mb-5 lg:mb-8">
                <h3 className="font-bold text-xs lg:text-sm text-land-ink mb-3 lg:mb-4 uppercase tracking-wider">
                  Waktu Beli
                </h3>
                <div className="space-y-3 lg:space-y-4">
                  {(
                    [
                      { label: "Semua Waktu", value: "semua" },
                      { label: "30 Hari Terakhir", value: "30days" },
                      { label: "3 Bulan Terakhir", value: "3months" },
                      { label: "Tahun Ini", value: "year" },
                    ] as { label: string; value: string }[]
                  ).map((t) => (
                    <label
                      key={t.value}
                      className="flex items-center gap-2.5 lg:gap-3 cursor-pointer group"
                    >
                      <input
                        type="radio"
                        name="time"
                        checked={timeFilter === t.value}
                        onChange={() => setTimeFilter(t.value)}
                        className="w-4 h-4 lg:w-5 lg:h-5 border-[#E8E0D5] text-[#009A44] focus:ring-[#009A44] transition-colors cursor-pointer"
                      />
                      <span
                        className={`text-sm lg:text-base font-medium transition-colors group-hover:text-land-ink ${
                          timeFilter === t.value
                            ? "text-[#009A44] font-semibold"
                            : "text-land-muted"
                        }`}
                      >
                        {t.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setStatusFilter("");
                  setTimeFilter("semua");
                }}
                className="btn-clay-secondary w-full py-3.5"
              >
                Terapkan Filter
              </button>
            </div>
          </div>

          {/* Right Content (Order List) */}
          <div className="w-full lg:w-3/4 flex flex-col gap-6">
            {/* Loading skeletons */}
            {loading &&
              [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white border border-[#E8E0D5] rounded-[32px] p-6 animate-pulse h-52"
                />
              ))}

            {/* Error */}
            {!loading && error && (
              <div className="bg-white border border-[#E8E0D5] rounded-[32px] p-12 text-center shadow-sm">
                <p className="text-land-muted font-bold mb-3">{error}</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="text-[#009A44] font-bold text-sm hover:underline"
                >
                  Coba lagi
                </button>
              </div>
            )}

            {/* Empty — belum ada pesanan sama sekali */}
            {!loading && !error && orders.length === 0 && (
              <div className="bg-white border border-[#E8E0D5] rounded-[32px] p-12 text-center shadow-sm">
                <Leaf className="w-12 h-12 text-[#E8E0D5] mx-auto mb-4" />
                <p className="font-bold text-land-ink text-xl mb-2">
                  Belum ada pesanan
                </p>
                <p className="text-land-muted text-sm mb-6">
                  Mulai berbelanja di marketplace untuk melihat pesanan di sini.
                </p>
                <Link
                  href="/marketplace"
                  className="btn-clay-primary px-8 py-3 inline-flex"
                >
                  Jelajahi Marketplace
                </Link>
              </div>
            )}

            {/* Empty — ada pesanan tapi tidak cocok filter/search */}
            {!loading &&
              !error &&
              orders.length > 0 &&
              visibleOrders.length === 0 && (
                <div className="bg-white border border-[#E8E0D5] rounded-[32px] p-12 text-center shadow-sm">
                  <Search className="w-12 h-12 text-[#E8E0D5] mx-auto mb-4" />
                  <p className="font-bold text-land-ink text-xl mb-2">
                    Tidak ada pesanan yang cocok
                  </p>
                  <p className="text-land-muted text-sm mb-6">
                    Coba ubah kata kunci atau filter status.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      setStatusFilter("");
                      setTimeFilter("semua");
                    }}
                    className="btn-clay-secondary px-8 py-3 inline-flex"
                  >
                    Reset Filter
                  </button>
                </div>
              )}

            {/* Order cards */}
            {!loading &&
              !error &&
              visibleOrders.map((order) => {
                const {
                  label: statusLabel,
                  Icon: StatusIcon,
                  color: statusColor,
                  bg: statusBg,
                } = statusMeta(order.status);

                // support both old (product) and new (items[]) order shapes
                const productName =
                  order.product?.name ??
                  order.items?.[0]?.product?.name ??
                  "Pesanan AgroWaste";
                const productImage =
                  order.product?.image_url ??
                  order.items?.[0]?.product?.image_url ??
                  null;

                const orderId =
                  order.order_number ||
                  (order.id.startsWith("AGW-")
                    ? order.id
                    : `AGW-${order.id.slice(0, 8).toUpperCase()}`);
                const isShipping = order.status === "dikirim";

                const isDeliveredByCourier =
                  order.shipment?.status === "terkirim" ||
                  order.shipment?.status === "selesai";

                const isPickupReady =
                  order.metode_pengiriman === "pickup" &&
                  (order.status === "dikirim" || order.status === "dikonfirmasi");

                const canConfirmReceipt =
                  order.status !== "selesai" &&
                  (isDeliveredByCourier || isPickupReady);

                const isPendingDelivery =
                  order.status !== "selesai" &&
                  !canConfirmReceipt &&
                  (order.status === "dikirim" ||
                    order.status === "dikonfirmasi" ||
                    order.status === "menunggu_konfirmasi" ||
                    order.shipment?.status === "sedang_berjalan" ||
                    order.shipment?.status === "dalam_perjalanan" ||
                    order.shipment?.status === "dijadwalkan");

                return (
                  <div
                    key={order.id}
                    className="bg-white border border-[#E8E0D5] rounded-[32px] p-6 shadow-[0_8px_24px_rgba(44,57,48,0.04)] flex flex-col gap-6 group hover:-translate-y-1 transition-transform"
                  >
                    {/* Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E0D5]/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-land-warm flex items-center justify-center shrink-0">
                          <Receipt className="w-5 h-5 text-[#009A44]" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-land-muted uppercase tracking-widest block mb-0.5">
                            ID Pesanan
                          </span>
                          <span className="font-mono font-bold text-land-ink text-sm">
                            {orderId}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${statusBg} ${statusColor}`}
                      >
                        <StatusIcon className="w-4 h-4" />
                        {statusLabel}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="flex flex-col gap-4">
                      <div className="flex gap-4 items-start">
                        <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-xl sm:rounded-[20px] bg-[#F0F5F1] shrink-0 border border-[#E8E0D5]/40 overflow-hidden flex items-center justify-center">
                          {productImage ? (
                            <img
                              src={getProductImageUrl(productImage)}
                              alt={productName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Leaf className="w-7 h-7 sm:w-10 sm:h-10 text-[#009A44]/20" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-land-heading font-bold text-lg sm:text-xl text-land-ink mb-1 truncate sm:whitespace-normal">
                            {productName}
                          </h3>
                          {order.quantity_kg && (
                            <p className="text-sm text-land-muted mb-2 font-medium">
                              {order.quantity_kg} kg
                            </p>
                          )}
                          {isShipping && (
                            <div
                              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm ${
                                isDeliveredByCourier
                                  ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                                  : "bg-amber-50 border border-amber-200 text-amber-700"
                              }`}
                            >
                              <Truck className="w-4 h-4" />{" "}
                              {isDeliveredByCourier
                                ? "Sudah sampai di lokasi pengiriman"
                                : "Sedang dalam perjalanan"}
                            </div>
                          )}
                        </div>
                        <div className="hidden sm:block text-right shrink-0">
                          <span className="text-[10px] font-bold text-land-muted uppercase tracking-widest block mb-1">
                            Total Pesanan
                          </span>
                          <span className="text-2xl font-bold text-[#009A44]">
                            {formatRupiah(order.total_price)}
                          </span>
                        </div>
                      </div>

                      {/* Mobile Only Total Pesanan */}
                      <div className="sm:hidden flex justify-between items-center bg-land-warm p-4 rounded-xl">
                        <span className="text-[10px] font-bold text-land-muted uppercase tracking-widest">
                          Total Pesanan
                        </span>
                        <span className="text-xl font-bold text-[#009A44]">
                          {formatRupiah(order.total_price)}
                        </span>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-[#E8E0D5]/50 mt-2">
                      <span className="text-xs font-bold text-land-muted">
                        Dipesan pada:{" "}
                        <span className="text-land-ink">
                          {formatDate(order.created_at)}
                        </span>
                      </span>

                      <div className="flex gap-2 w-full sm:w-auto items-center justify-end flex-wrap sm:flex-nowrap">
                        {/* 1. STATE SELESAI */}
                        {order.status === "selesai" ? (
                          <>
                            {(!order.reviews || order.reviews.length === 0) && (
                              <Link
                                href={`/marketplace/${order.product?.id || order.items?.[0]?.product_id || order.items?.[0]?.product?.id || ""}`}
                                className="btn-clay-primary bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                              >
                                <Star className="w-3.5 h-3.5 fill-white text-white" />
                                Ulas Produk
                              </Link>
                            )}
                            <Link
                              href="/marketplace"
                              className="btn-clay-primary px-4 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5"
                            >
                              Beli Lagi
                            </Link>
                          </>
                        ) : (
                          /* 2. STATE BELUM SELESAI */
                          <>
                            {canConfirmReceipt && (
                              <button
                                type="button"
                                onClick={() => handleConfirmReceipt(order.id)}
                                disabled={confirmLoadingId === order.id}
                                className="btn-clay-primary bg-[#009A44] hover:bg-[#008139] px-4 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 text-white shadow-md shadow-[#009A44]/20 active:scale-95 transition-all disabled:opacity-60"
                              >
                                {confirmLoadingId === order.id ? (
                                  <>
                                    <svg
                                      className="animate-spin h-3.5 w-3.5 text-white"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                    >
                                      <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                      />
                                      <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                      />
                                    </svg>
                                    Memproses...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Pesanan Diterima
                                  </>
                                )}
                              </button>
                            )}

                            {isPendingDelivery && (
                              <button
                                type="button"
                                disabled
                                title="Pesanan belum sampai di lokasi Anda."
                                className="px-4 py-2.5 text-xs font-bold rounded-xl bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed flex items-center justify-center gap-1.5"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-gray-300" />
                                Pesanan Diterima
                              </button>
                            )}

                            {(order.status === "dikirim" ||
                              order.shipment ||
                              order.metode_pengiriman === "logistik") && (
                              <Link
                                href={`/pesanan/${order.id}/lacak`}
                                className="btn-clay-primary bg-[#1C231F] hover:bg-[#2C3930] px-4 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 text-white shadow-sm transition-all active:scale-95"
                              >
                                <MapPin className="w-3.5 h-3.5 text-[#4ADE80]" />
                                Lacak
                              </Link>
                            )}
                          </>
                        )}

                        <Link
                          href={`/pesanan/${order.id}`}
                          className="btn-clay-secondary px-4 py-2.5 text-xs font-bold flex items-center justify-center"
                        >
                          Detail
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
