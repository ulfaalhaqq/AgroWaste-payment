"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Package,
  Receipt,
  Truck,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Leaf,
  AlertCircle,
  Star,
  Download,
} from "lucide-react";
import { ReviewItem } from "@/types/order";
import { apiFetch, getProductImageUrl } from "@/lib/api";
import { getToken } from "@/lib/auth";

/* ── Types ───────────────────────────────────────────────────────────────── */

interface OrderItemProduct {
  name: string;
  unit: string;
  kondisi: string | null;
  jenis_ternak: string;
  provinsi: string;
  kabupaten: string;
  image_url?: string | null;
}

interface OrderItemDetail {
  product_id?: string;
  quantity_kg: string;
  price_per_kg: string;
  product: OrderItemProduct;
}

interface LegacyProduct {
  name: string;
  unit: string;
  image_url?: string | null;
}

interface OrderDetail {
  id: string;
  order_number?: string;
  status: string;
  total_price: string | number;
  quantity_kg?: string | number;
  metode_pengiriman?: string;
  metode_pembayaran?: string;
  alamat_pengiriman?: string | null;
  created_at: string;
  rejection_reason?: string | null;
  items?: OrderItemDetail[];
  product?: LegacyProduct | null;
  shipment?: { status: string } | null;
  reviews?: ReviewItem[];
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function formatRupiah(n: string | number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(n));
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return (
    new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d) + " WIB"
  );
}

interface StatusMeta {
  label: string;
  Icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
}

function statusMeta(status: string): StatusMeta {
  switch (status) {
    case "menunggu_pembayaran":
      return {
        label: "Menunggu Pembayaran",
        Icon: Clock,
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
      };
    case "dikonfirmasi":
      return {
        label: "Dikonfirmasi",
        Icon: CheckCircle2,
        color: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-200",
      };
    case "dikirim":
      return {
        label: "Sedang Dikirim",
        Icon: Truck,
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
      };
    case "selesai":
      return {
        label: "Selesai",
        Icon: CheckCircle2,
        color: "text-[#009A44]",
        bg: "bg-[#009A44]/10",
        border: "border-[#009A44]/20",
      };
    case "ditolak":
      return {
        label: "Ditolak",
        Icon: XCircle,
        color: "text-red-600",
        bg: "bg-red-50",
        border: "border-red-200",
      };
    default:
      return {
        label: "Menunggu",
        Icon: Clock,
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
      };
  }
}

function metodePembayaranLabel(m?: string) {
  if (m === "midtrans") return "Midtrans (Online)";
  return "Transfer Manual";
}

/* ── Component ───────────────────────────────────────────────────────────── */

export default function DetailPesananContent({ id }: { id: string }) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmSuccess, setConfirmSuccess] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const handleConfirmReceipt = async () => {
    if (!window.confirm("Yakin barang sudah diterima?")) {
      return;
    }
    setConfirmLoading(true);
    setConfirmError(null);
    setConfirmSuccess(null);
    try {
      const res = await apiFetch(`/orders/${id}/complete`, {
        method: "PUT",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setConfirmError(
          json.message ?? "Gagal mengonfirmasi penerimaan barang.",
        );
      } else {
        setConfirmSuccess(json.message ?? "Pesanan berhasil diselesaikan.");
        setOrder((prev) => (prev ? { ...prev, status: "selesai" } : null));
      }
    } catch {
      setConfirmError("Tidak dapat terhubung ke server.");
    } finally {
      setConfirmLoading(false);
    }
  };

  useEffect(() => {
    if (!getToken()) {
      router.push(`/login?callbackUrl=/pesanan/${id}`);
      return;
    }
    apiFetch("/orders")
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat pesanan.");
        return res.json();
      })
      .then((json) => {
        const list = json.data as OrderDetail[];
        const found = list.find((o) => o.id === id);
        if (!found) {
          setError("not_found");
        } else {
          setOrder(found);
        }
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id, router]);

  /* ── Loading ─────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex-1 animate-fade-in bg-[#F8FAF9] min-h-screen pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 space-y-6">
          <div className="h-12 w-64 bg-[#E8E0D5] rounded-full animate-pulse" />
          <div className="h-24 bg-[#E8E0D5] rounded-[32px] animate-pulse" />
          <div className="h-48 bg-[#E8E0D5] rounded-[32px] animate-pulse" />
          <div className="grid grid-cols-2 gap-6">
            <div className="h-48 bg-[#E8E0D5] rounded-[32px] animate-pulse" />
            <div className="h-48 bg-[#E8E0D5] rounded-[32px] animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  /* ── Not found / error ───────────────────────────────────────────────── */
  if (error || !order) {
    return (
      <div className="flex-1 flex items-center justify-center py-32 bg-[#F8FAF9]">
        <div className="text-center">
          <Package className="w-12 h-12 text-[#E8E0D5] mx-auto mb-4" />
          <p className="font-bold text-land-ink text-xl mb-2">
            {error === "not_found"
              ? "Pesanan tidak ditemukan"
              : (error ?? "Terjadi kesalahan")}
          </p>
          <Link
            href="/pesanan"
            className="text-[#009A44] font-bold text-sm hover:underline"
          >
            ← Kembali ke Riwayat Pesanan
          </Link>
        </div>
      </div>
    );
  }

  /* ── Derived values ──────────────────────────────────────────────────── */
  const {
    label: statusLabel,
    Icon: StatusIcon,
    color: statusColor,
    bg: statusBg,
    border: statusBorder,
  } = statusMeta(order.status);
  const displayOrderId =
    order.order_number ||
    (order.id.startsWith("AGW-")
      ? order.id
      : `AGW-${order.id.slice(0, 8).toUpperCase()}`);
  const isPickup = order.metode_pengiriman === "pickup";

  const isDeliveredByCourier =
    order.shipment?.status === "terkirim" ||
    order.shipment?.status === "selesai";

  const isPickupReady =
    order.metode_pengiriman === "pickup" &&
    (order.status === "dikirim" || order.status === "dikonfirmasi");

  const canConfirmReceipt =
    order.status !== "selesai" && (isDeliveredByCourier || isPickupReady);

  const isPendingDelivery =
    order.status !== "selesai" &&
    !canConfirmReceipt &&
    (order.status === "dikirim" ||
      order.status === "dikonfirmasi" ||
      order.status === "menunggu_konfirmasi" ||
      order.shipment?.status === "sedang_berjalan" ||
      order.shipment?.status === "dalam_perjalanan" ||
      order.shipment?.status === "dijadwalkan");

  // Normalise items — support both checkout (items[]) and old (product field)
  const displayItems: Array<{
    name: string;
    unit: string;
    qty: string;
    pricePerKg: string | null;
    subtotal: number;
    image_url: string | null;
  }> =
    order.items && order.items.length > 0
      ? order.items.map((item) => ({
          name: item.product?.name ?? "Produk",
          unit: item.product?.unit ?? "kg",
          qty: item.quantity_kg,
          pricePerKg: item.price_per_kg,
          subtotal: Number(item.quantity_kg) * Number(item.price_per_kg),
          image_url: item.product?.image_url ?? null,
        }))
      : order.product
        ? [
            {
              name: order.product.name,
              unit: order.product.unit ?? "kg",
              qty: String(order.quantity_kg ?? "—"),
              pricePerKg: null,
              subtotal: Number(order.total_price),
              image_url: order.product.image_url ?? null,
            },
          ]
        : [];

  const itemsSubtotal = displayItems.reduce((acc, i) => acc + i.subtotal, 0);

  return (
    <div className="flex-1 animate-fade-in bg-[#F8FAF9] min-h-screen pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/pesanan"
              className="w-12 h-12 rounded-full bg-white border border-[#E8E0D5] flex items-center justify-center text-land-ink hover:border-[#009A44] hover:text-[#009A44] transition-colors shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-land-heading font-bold text-land-ink">
                Rincian Pesanan
              </h1>
              <p className="text-sm text-land-muted">
                ID:{" "}
                <span className="font-mono font-bold text-land-ink">
                  {displayOrderId}
                </span>
              </p>
            </div>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[10px] font-bold text-land-muted uppercase tracking-wider mb-0.5">
              Tanggal Beli
            </span>
            <span className="text-sm font-bold text-land-ink">
              {formatDateTime(order.created_at)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* ── Rejection reason banner ─────────────────────────────── */}
          {order.status === "ditolak" && order.rejection_reason && (
            <div className="rounded-[24px] bg-red-50 border border-red-200 p-5 flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-700 text-sm mb-0.5">
                  Alasan Penolakan
                </p>
                <p className="text-sm text-red-600 leading-relaxed">
                  {order.rejection_reason}
                </p>
              </div>
            </div>
          )}

          {/* ── Status Banner ───────────────────────────────────────── */}
          <div
            className={`rounded-[32px] p-6 flex flex-col sm:flex-row justify-between items-center gap-4 border ${statusBorder} ${statusBg}`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center bg-white shadow-sm ${statusColor}`}
              >
                <StatusIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`font-bold text-lg ${statusColor}`}>
                  Pesanan {statusLabel}
                </h3>
                <p className="text-sm text-land-ink/70">
                  Terima kasih telah berbelanja pupuk sirkular di AgroWaste.
                </p>
              </div>
            </div>
          </div>

          {/* ── Daftar Produk ───────────────────────────────────────── */}
          <div className="bg-white border border-[#E8E0D5] rounded-[32px] p-6 md:p-8 shadow-[0_8px_32px_rgba(44,57,48,0.03)]">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-[#E8E0D5]">
              <Package className="w-5 h-5 text-land-ink" />
              <h2 className="font-land-heading font-bold text-xl text-land-ink">
                Daftar Produk
              </h2>
            </div>

            {displayItems.length === 0 ? (
              <p className="text-sm text-land-muted">
                Data produk tidak tersedia.
              </p>
            ) : (
              <div className="flex flex-col gap-6">
                {displayItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex gap-4 items-start sm:items-center"
                  >
                    {/* Gambar produk */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[16px] bg-[#F0F5F1] shrink-0 border border-[#E8E0D5] overflow-hidden flex items-center justify-center">
                      {item.image_url ? (
                        <img
                          src={getProductImageUrl(item.image_url)}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Leaf className="w-7 h-7 sm:w-8 sm:h-8 text-[#009A44]/20" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-land-ink text-sm sm:text-base mb-1 truncate sm:whitespace-normal">
                        {item.name}
                      </h3>
                      {item.pricePerKg !== null ? (
                        <p className="text-xs sm:text-sm text-land-muted mb-1">
                          {item.qty} {item.unit} ×{" "}
                          {formatRupiah(item.pricePerKg)}/{item.unit}
                        </p>
                      ) : (
                        <p className="text-xs sm:text-sm text-land-muted mb-1">
                          {item.qty} {item.unit}
                        </p>
                      )}
                      {/* Mobile Only Price */}
                      <div className="sm:hidden mt-2">
                        <span className="text-[10px] font-bold text-land-muted uppercase tracking-wider block">
                          Total Harga
                        </span>
                        <span className="font-bold text-[#009A44] text-base">
                          {formatRupiah(item.subtotal)}
                        </span>
                      </div>
                    </div>
                    <div className="hidden sm:block text-right shrink-0">
                      <span className="text-[10px] font-bold text-land-muted uppercase tracking-wider block mb-1">
                        Total Harga
                      </span>
                      <span className="font-bold text-land-ink text-lg">
                        {formatRupiah(item.subtotal)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Grid Informasi Tambahan ─────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Info Pengiriman */}
            <div className="bg-white border border-[#E8E0D5] rounded-[32px] p-6 md:p-8 shadow-[0_8px_32px_rgba(44,57,48,0.03)] flex flex-col">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#E8E0D5]">
                <MapPin className="w-5 h-5 text-land-ink" />
                <h2 className="font-land-heading font-bold text-xl text-land-ink">
                  Info Pengiriman
                </h2>
              </div>

              <div className="mb-3">
                <span className="px-2 py-1 bg-land-warm text-land-muted text-[10px] font-bold rounded uppercase tracking-widest">
                  {isPickup ? "Pickup" : "Logistik"}
                </span>
              </div>

              {isPickup ? (
                <p className="text-sm text-land-muted leading-relaxed flex-1">
                  Pembeli mengambil langsung di lokasi peternak. Jadwal
                  koordinasi langsung dengan peternak.
                </p>
              ) : (
                <p className="text-sm text-land-muted leading-relaxed flex-1 whitespace-pre-line">
                  {order.alamat_pengiriman ?? "Alamat tidak tersedia"}
                </p>
              )}

              <div className="mt-auto pt-4 border-t border-[#E8E0D5]/50 flex items-center gap-3">
                <Truck className="w-4 h-4 text-land-muted" />
                <span className="text-sm font-bold text-land-ink">
                  {isPickup
                    ? "Ambil Sendiri (Pickup)"
                    : "Mitra Logistik AgroWaste"}
                </span>
              </div>
            </div>

            {/* Rincian Pembayaran */}
            <div className="bg-white border border-[#E8E0D5] rounded-[32px] p-6 md:p-8 shadow-[0_8px_32px_rgba(44,57,48,0.03)] flex flex-col">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#E8E0D5]">
                <FileText className="w-5 h-5 text-land-ink" />
                <h2 className="font-land-heading font-bold text-xl text-land-ink">
                  Rincian Pembayaran
                </h2>
              </div>

              <div className="flex flex-col gap-3 text-sm text-land-muted flex-1">
                <div className="flex justify-between items-center">
                  <span>Metode Pembayaran</span>
                  <span className="font-bold text-land-ink">
                    {metodePembayaranLabel(order.metode_pembayaran)}
                  </span>
                </div>
                {/* Per-item breakdown */}
                {displayItems.map((item, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="truncate max-w-[55%]">{item.name}</span>
                    <span className="text-land-ink">
                      {formatRupiah(item.subtotal)}
                    </span>
                  </div>
                ))}
                {/* Subtotal jika lebih dari satu item */}
                {displayItems.length > 1 && (
                  <div className="flex justify-between items-center pt-1 border-t border-dashed border-[#E8E0D5]">
                    <span>Subtotal Produk</span>
                    <span className="text-land-ink">
                      {formatRupiah(itemsSubtotal)}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-auto pt-4 border-t border-[#E8E0D5] flex justify-between items-center">
                <span className="font-bold text-land-ink">Total Belanja</span>
                <span className="text-2xl font-bold text-[#009A44]">
                  {formatRupiah(order.total_price)}
                </span>
              </div>
            </div>
          </div>

          {/* ── Beli Lagi & Konfirmasi Terima Barang ───────────────────────────────────────────── */}
          {confirmSuccess && (
            <div className="mt-4 px-4 py-3 rounded-2xl bg-[#E6F5EC] border border-[#B2DFCB] text-[#009A44] text-sm font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              {confirmSuccess}
            </div>
          )}
          {confirmError && (
            <div className="mt-4 px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-bold flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              {confirmError}
            </div>
          )}

          <div className="flex justify-end gap-4 mt-4 items-center flex-wrap">
            {canConfirmReceipt && order.status !== "selesai" && (
              <button
                type="button"
                onClick={handleConfirmReceipt}
                disabled={confirmLoading}
                className="btn-clay-primary bg-[#009A44] hover:bg-[#008139] px-8 py-4 flex items-center gap-2 text-white shadow-md shadow-[#009A44]/20 active:scale-95 transition-all disabled:opacity-60"
              >
                {confirmLoading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
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
                    <CheckCircle2 className="w-5 h-5" />
                    Konfirmasi Pesanan Diterima
                  </>
                )}
              </button>
            )}

            {isPendingDelivery && (
              <button
                type="button"
                disabled
                title="Pesanan belum sampai. Tombol ini akan aktif otomatis ketika kurir mengonfirmasi barang telah sampai di lokasi Anda."
                className="px-8 py-4 text-sm font-bold rounded-2xl bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed flex items-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5 text-gray-300" />
                Konfirmasi Pesanan Diterima
              </button>
            )}

            {(order.status === "dikirim" ||
              order.shipment ||
              order.metode_pengiriman === "logistik") && (
              <Link
                href={`/pesanan/${order.id}/lacak`}
                className="btn-clay-primary px-8 py-4 flex items-center gap-2 bg-[#1C231F] hover:bg-[#2C3930] text-white rounded-2xl font-bold shadow-md transition-all"
              >
                <MapPin className="w-5 h-5 text-[#4ADE80]" />
                Lacak Pengiriman Live
              </Link>
            )}

            {order.status === "selesai" &&
              (!order.reviews || order.reviews.length === 0) && (
                <Link
                  href={`/marketplace/${order.items?.[0]?.product_id || ""}`}
                  className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <Star className="w-5 h-5 fill-white text-white" /> Beri Ulasan
                </Link>
              )}

            <Link href="/marketplace" className="btn-clay-secondary px-8 py-4">
              Beli Lagi Pesanan Ini
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
