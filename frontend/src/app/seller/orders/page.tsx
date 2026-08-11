"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiFetch, getProductImageUrl } from "@/lib/api";

interface OrderItem {
  quantity_kg: string | number;
  price_per_kg: string | number;
  product?: { id: string; name: string; image_url?: string | null };
}

interface Order {
  id: string;
  order_number?: string;
  total_price: string | number;
  status: string;
  metode_pengiriman?: string;
  metode_pembayaran?: string;
  alamat_pengiriman?: string;
  rejection_reason?: string | null;
  created_at: string;
  items?: OrderItem[];
  product?: { id: string; name: string; image_url?: string | null };
  payment?: { status: string; proof?: { image_path: string } };
}

const TAB_MAP: Record<string, string> = {
  Semua: "",
  "Menunggu Konfirmasi": "menunggu_pembayaran",
  Diproses: "dikonfirmasi",
  Dikirim: "dikirim",
  Selesai: "selesai",
  Dibatalkan: "ditolak",
};

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

function statusBadge(status: string) {
  switch (status) {
    case "menunggu_pembayaran":
      return {
        label: "Menunggu Pembayaran",
        cls: "bg-amber-100 text-amber-700",
      };
    case "menunggu_konfirmasi":
      return {
        label: "Menunggu Konfirmasi",
        cls: "bg-amber-100 text-amber-700",
      };
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

function OrdersContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Semua");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchOrders = () => {
    setLoading(true);
    apiFetch("/orders")
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json) => {
        setOrders(json.data as Order[]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const visible = useMemo(() => {
    const statusFilter = TAB_MAP[activeTab];
    if (!statusFilter) return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, activeTab]);

  const handleProcess = async (
    order: Order,
    status: "dikonfirmasi" | "ditolak",
    reason?: string,
  ) => {
    setProcessingId(order.id);
    setActionError(null);
    try {
      const body: Record<string, string> = { status };
      if (status === "ditolak" && reason) body.rejection_reason = reason;
      const res = await apiFetch(`/orders/${order.id}/process`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setActionError(json.message ?? "Gagal memproses pesanan.");
        return;
      }
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? { ...o, status, rejection_reason: reason ?? null }
            : o,
        ),
      );
      setRejectingOrder(null);
      setRejectionReason("");
    } catch {
      setActionError("Tidak dapat terhubung ke server.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpdateStatus = async (order: Order, status: "dikirim") => {
    setProcessingId(order.id);
    setActionError(null);
    try {
      const body = { status };
      const res = await apiFetch(`/orders/${order.id}/status`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setActionError(json.message ?? "Gagal memperbarui status pesanan.");
        return;
      }
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status } : o)),
      );
    } catch {
      setActionError("Tidak dapat terhubung ke server.");
    } finally {
      setProcessingId(null);
    }
  };

  // detail view
  if (orderId) {
    const order = orders.find((o) => o.id === orderId);

    return (
      <div className="space-y-6 animate-fade-in pb-10">
        <div className="flex items-center text-xs font-bold text-seller-textsecondary mb-2">
          <Link href="/seller/orders" className="hover:text-seller-primary">
            Pesanan
          </Link>
          <span className="mx-2">&rsaquo;</span>
          <span className="text-seller-textprimary">
            {order?.order_number ?? orderId.slice(0, 8).toUpperCase()}
          </span>
        </div>

        {loading && (
          <div className="p-12 text-center text-seller-textsecondary text-sm animate-pulse">
            Memuat detail pesanan...
          </div>
        )}

        {!loading && !order && (
          <div className="p-12 text-center">
            <p className="text-seller-textsecondary mb-4">
              Pesanan tidak ditemukan.
            </p>
            <Link
              href="/seller/orders"
              className="text-seller-primary font-bold text-sm hover:underline"
            >
              ← Kembali ke Daftar
            </Link>
          </div>
        )}

        {!loading &&
          order &&
          (() => {
            const { label, cls } = statusBadge(order.status);
            const items = order.items ?? [];
            return (
              <>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <h2 className="text-3xl font-bold tracking-tight text-seller-textprimary">
                    Detail Pesanan
                  </h2>
                  {(order.status === "menunggu_pembayaran" ||
                    order.status === "menunggu_konfirmasi") && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleProcess(order, "dikonfirmasi")}
                        disabled={processingId === order.id}
                        className="px-4 py-2 bg-seller-primary text-white rounded-xl text-sm font-bold hover:bg-seller-primary-hover transition-colors disabled:opacity-60"
                      >
                        {processingId === order.id
                          ? "Memproses..."
                          : "Terima Pesanan"}
                      </button>
                      <button
                        onClick={() => {
                          setRejectingOrder(order);
                          setRejectionReason("");
                        }}
                        disabled={processingId === order.id}
                        className="px-4 py-2 border-2 border-red-400 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors disabled:opacity-60"
                      >
                        Tolak
                      </button>
                    </div>
                  )}
                  {order.status === "dikonfirmasi" && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleUpdateStatus(order, "dikirim")}
                        disabled={processingId === order.id}
                        className="px-4 py-2 bg-seller-primary text-white rounded-xl text-sm font-bold hover:bg-seller-primary-hover transition-colors disabled:opacity-60"
                      >
                        {processingId === order.id
                          ? "Memproses..."
                          : "Kirim Barang"}
                      </button>
                    </div>
                  )}
                </div>

                {actionError && (
                  <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-semibold">
                    {actionError}
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    {/* Ringkasan Status */}
                    <div className="bg-seller-surfacewhite border border-seller-hairline p-6 rounded-2xl">
                      <div className="flex justify-between items-start mb-6 pb-6 border-b border-seller-hairline">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-seller-primary-light text-seller-primary flex items-center justify-center">
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-seller-textsecondary tracking-wider block mb-0.5">
                              ID PESANAN
                            </span>
                            <h3 className="text-lg font-bold text-seller-textprimary">
                              #
                              {order.order_number ??
                                order.id.slice(0, 8).toUpperCase()}
                            </h3>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-seller-textsecondary tracking-wider block mb-0.5">
                            TANGGAL PESANAN
                          </span>
                          <h3 className="text-sm font-bold text-seller-textprimary">
                            {formatDate(order.created_at)}
                          </h3>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <span className="text-[10px] font-bold text-seller-textsecondary tracking-wider block mb-2">
                            STATUS
                          </span>
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${cls}`}
                          >
                            {label}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-seller-textsecondary tracking-wider block mb-2">
                            METODE PENGIRIMAN
                          </span>
                          <span className="text-sm font-bold text-seller-textprimary capitalize">
                            {order.metode_pengiriman ?? "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-seller-textsecondary tracking-wider block mb-2">
                            TOTAL PESANAN
                          </span>
                          <span className="text-lg font-bold text-seller-semgreen font-tabular">
                            {formatRupiah(order.total_price)}
                          </span>
                        </div>
                        {order.status === "ditolak" &&
                          order.rejection_reason && (
                            <div className="col-span-3 mt-2 p-3.5 bg-red-50 border border-red-200 rounded-xl">
                              <span className="text-[10px] font-bold text-red-700 tracking-wider block mb-1">
                                ALASAN PENOLAKAN
                              </span>
                              <p className="text-xs text-red-800 font-medium leading-relaxed">
                                {order.rejection_reason}
                              </p>
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Rincian Produk */}
                    <div className="bg-seller-surfacewhite border border-seller-hairline rounded-2xl overflow-hidden">
                      <div className="p-6 border-b border-seller-hairline">
                        <h3 className="text-lg font-bold text-seller-textprimary">
                          Rincian Produk
                        </h3>
                      </div>
                      <div className="divide-y divide-seller-hairline">
                        {items.length > 0 ? (
                          items.map((item, i) => (
                            <div
                              key={i}
                              className="p-6 flex gap-6 items-center"
                            >
                              <div className="w-16 h-16 rounded-xl bg-[#EAE6E1] shrink-0 flex items-center justify-center text-seller-textsecondary text-[10px] font-bold relative overflow-hidden border border-seller-hairline">
                                {item.product?.image_url ? (
                                  <img
                                    src={getProductImageUrl(
                                      item.product.image_url,
                                    )}
                                    alt={item.product.name ?? "Produk"}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    onError={(e) => {
                                      (
                                        e.currentTarget as HTMLImageElement
                                      ).style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <span>IMG</span>
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="text-base font-bold text-seller-textprimary">
                                  {item.product?.name ?? "Produk"}
                                </h4>
                                <div className="flex gap-8 mt-2">
                                  <div>
                                    <span className="text-[10px] font-bold text-seller-textsecondary tracking-wider block">
                                      HARGA/KG
                                    </span>
                                    <span className="text-sm font-bold text-seller-textprimary font-tabular">
                                      {formatRupiah(item.price_per_kg)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-bold text-seller-textsecondary tracking-wider block">
                                      JUMLAH
                                    </span>
                                    <span className="text-sm font-bold text-seller-textprimary font-tabular">
                                      {Number(item.quantity_kg).toLocaleString(
                                        "id-ID",
                                      )}{" "}
                                      kg
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] font-bold text-seller-textsecondary tracking-wider block mb-1">
                                  SUBTOTAL
                                </span>
                                <span className="text-base font-bold text-seller-semgreen font-tabular">
                                  {formatRupiah(
                                    Number(item.price_per_kg) *
                                      Number(item.quantity_kg),
                                  )}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-6 text-xs text-seller-textsecondary">
                            Detail produk tidak tersedia.
                          </div>
                        )}
                      </div>
                      <div className="p-6 bg-[#F9F8F6] border-t border-seller-hairline flex justify-between items-center">
                        <span className="font-bold text-seller-textprimary">
                          Total Pesanan
                        </span>
                        <span className="text-xl font-bold text-seller-textprimary font-tabular">
                          {formatRupiah(order.total_price)}
                        </span>
                      </div>
                    </div>

                    {/* Laporan Logistik & Bukti Foto Kurir */}
                    {(() => {
                      const getProofData = (id: string) => {
                        try {
                          const saved = localStorage.getItem(
                            "agrowaste_shipment_proofs",
                          );
                          if (saved) {
                            const parsed = JSON.parse(saved);
                            return parsed[id] || null;
                          }
                        } catch {
                          return null;
                        }
                        return null;
                      };

                      const proof = getProofData(order.id);
                      const isOngkirPaid = proof?.isOngkirPaid ?? false;
                      const fotoPickup = proof?.fotoPickup;
                      const fotoDelivery = proof?.fotoDelivery;

                      return (
                        <div className="bg-seller-surfacewhite border border-seller-hairline p-6 rounded-2xl space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-seller-hairline pb-4 gap-2">
                            <div>
                              <h3 className="text-lg font-bold text-seller-textprimary">
                                Laporan Logistik & Bukti Foto Kurir
                              </h3>
                              <p className="text-xs text-seller-textsecondary">
                                Bukti serah terima barang dan status pembayaran
                                ongkir dari mitra kurir.
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                                isOngkirPaid
                                  ? "bg-green-100 text-green-700 border border-green-200"
                                  : "bg-amber-100 text-amber-800 border border-amber-200"
                              }`}
                            >
                              Ongkir:{" "}
                              {isOngkirPaid
                                ? "LUNAS (DITERIMA KURIR)"
                                : "BELUM DIBAYAR"}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            {/* Foto Pickup */}
                            <div className="p-4 bg-seller-warmbg/50 border border-seller-hairline rounded-xl space-y-2">
                              <span className="text-xs font-bold text-seller-textprimary block">
                                Foto Bukti Pengambilan (Peternak)
                              </span>
                              {fotoPickup ? (
                                <a
                                  href={fotoPickup}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block rounded-xl overflow-hidden h-40 border border-seller-hairline hover:opacity-90 transition-opacity"
                                >
                                  <img
                                    src={fotoPickup}
                                    alt="Foto Pengambilan"
                                    className="w-full h-full object-cover"
                                  />
                                </a>
                              ) : (
                                <div className="h-40 border border-dashed border-seller-hairline rounded-xl flex items-center justify-center text-xs text-seller-textsecondary bg-white">
                                  Belum ada bukti foto pengambilan
                                </div>
                              )}
                            </div>

                            {/* Foto Delivery */}
                            <div className="p-4 bg-seller-warmbg/50 border border-seller-hairline rounded-xl space-y-2">
                              <span className="text-xs font-bold text-seller-textprimary block">
                                Foto Bukti Penyerahan (Diterima Pembeli)
                              </span>
                              {fotoDelivery ? (
                                <a
                                  href={fotoDelivery}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block rounded-xl overflow-hidden h-40 border border-seller-hairline hover:opacity-90 transition-opacity"
                                >
                                  <img
                                    src={fotoDelivery}
                                    alt="Foto Penyerahan"
                                    className="w-full h-full object-cover"
                                  />
                                </a>
                              ) : (
                                <div className="h-40 border border-dashed border-seller-hairline rounded-xl flex items-center justify-center text-xs text-seller-textsecondary bg-white">
                                  Belum ada bukti foto penyerahan
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Sidebar detail */}
                  <div className="space-y-6">
                    <div className="bg-seller-surfacewhite border border-seller-hairline p-6 rounded-2xl">
                      <h3 className="font-bold text-seller-textprimary mb-4">
                        Informasi Pengiriman
                      </h3>
                      <div className="space-y-4 text-sm">
                        <div>
                          <span className="text-[10px] font-bold text-seller-textsecondary tracking-wider block mb-1">
                            METODE
                          </span>
                          <p className="font-bold text-seller-textprimary capitalize">
                            {order.metode_pengiriman ?? "—"}
                          </p>
                        </div>
                        {order.alamat_pengiriman && (
                          <div>
                            <span className="text-[10px] font-bold text-seller-textsecondary tracking-wider block mb-1">
                              ALAMAT PENGIRIMAN
                            </span>
                            <p className="text-seller-textprimary leading-relaxed">
                              {order.alamat_pengiriman}
                            </p>
                          </div>
                        )}
                        <div>
                          <span className="text-[10px] font-bold text-seller-textsecondary tracking-wider block mb-1">
                            METODE PEMBAYARAN
                          </span>
                          <p className="font-bold text-seller-textprimary capitalize">
                            {order.metode_pembayaran === "cod"
                              ? "COD (Bayar di Tempat)"
                              : (order.metode_pembayaran ?? "—")}
                          </p>
                        </div>

                        {order.metode_pembayaran === "manual" &&
                          order.payment?.proof && (
                            <div className="pt-4 border-t border-seller-hairline">
                              <span className="text-[10px] font-bold text-seller-textsecondary tracking-wider block mb-2">
                                BUKTI PEMBAYARAN
                              </span>
                              <a
                                href={getProductImageUrl(
                                  order.payment.proof.image_path,
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block rounded-xl overflow-hidden border border-seller-hairline hover:opacity-90 transition-opacity"
                              >
                                <img
                                  src={getProductImageUrl(
                                    order.payment.proof.image_path,
                                  )}
                                  alt="Bukti Pembayaran"
                                  className="w-full h-32 object-cover"
                                  onError={(e) => {
                                    (
                                      e.currentTarget as HTMLImageElement
                                    ).style.display = "none";
                                  }}
                                />
                              </a>
                              <p className="text-[10px] text-seller-textsecondary mt-1 text-center">
                                Klik gambar untuk memperbesar
                              </p>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
      </div>
    );
  }

  // list view
  return (
    <>
      <div className="space-y-6 animate-fade-in pb-10">
        <h2 className="text-3xl font-bold tracking-tight text-seller-textprimary mb-6">
          Daftar Pesanan
        </h2>

        {actionError && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-semibold">
            {actionError}
            <button
              onClick={() => setActionError(null)}
              className="ml-2 underline"
            >
              Tutup
            </button>
          </div>
        )}

        <div className="bg-seller-surfacewhite border border-seller-hairline rounded-2xl overflow-hidden">
          {/* Tab Bar */}
          <div className="p-6 border-b border-seller-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap bg-seller-warmbg p-1.5 rounded-xl gap-1 max-w-max">
              {Object.keys(TAB_MAP).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 font-bold rounded-lg text-xs transition-all ${
                    activeTab === tab
                      ? "bg-seller-surfacewhite text-seller-primary shadow-sm"
                      : "text-seller-textsecondary hover:text-seller-textprimary"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#F9F8F6] text-[10px] font-bold text-seller-textsecondary uppercase tracking-wider border-b border-seller-hairline">
                <tr>
                  <th className="px-6 py-4">Detail Pesanan</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-seller-hairline bg-white">
                {loading && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-seller-textsecondary text-xs animate-pulse"
                    >
                      Memuat pesanan...
                    </td>
                  </tr>
                )}
                {!loading && visible.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-seller-textsecondary text-xs"
                    >
                      Tidak ada pesanan.
                    </td>
                  </tr>
                )}
                {!loading &&
                  visible.map((order) => {
                    const { label, cls } = statusBadge(order.status);
                    const orderId =
                      order.order_number ?? order.id.slice(0, 8).toUpperCase();
                    const productName =
                      order.items?.[0]?.product?.name ??
                      order.product?.name ??
                      "Pesanan AgroWaste";
                    const isPending =
                      order.status === "menunggu_pembayaran" ||
                      order.status === "menunggu_konfirmasi";
                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-seller-warmbg/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-seller-semgreen text-xs mb-1">
                            #{orderId}
                          </div>
                          <div className="text-[10px] text-seller-textsecondary mb-1">
                            {formatDate(order.created_at)}
                          </div>
                          <div className="font-semibold text-seller-textprimary text-sm">
                            {productName}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-seller-textprimary font-tabular">
                          {formatRupiah(order.total_price)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${cls}`}
                          >
                            {label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/seller/orders?id=${order.id}`}
                              className="inline-block px-3 py-1.5 border border-seller-primary text-seller-primary rounded-lg text-xs font-bold hover:bg-seller-primary hover:text-white transition-colors"
                            >
                              Detail
                            </Link>
                            {isPending && (
                              <>
                                <button
                                  onClick={() =>
                                    handleProcess(order, "dikonfirmasi")
                                  }
                                  disabled={processingId === order.id}
                                  className="px-3 py-1.5 bg-seller-primary text-white rounded-lg text-xs font-bold hover:bg-seller-primary-hover transition-colors disabled:opacity-60"
                                >
                                  Terima
                                </button>
                                <button
                                  onClick={() => {
                                    setRejectingOrder(order);
                                    setRejectionReason("");
                                    setActionError(null);
                                  }}
                                  disabled={processingId === order.id}
                                  className="px-3 py-1.5 border border-red-400 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors disabled:opacity-60"
                                >
                                  Tolak
                                </button>
                              </>
                            )}
                            {order.status === "dikonfirmasi" && (
                              <button
                                onClick={() =>
                                  handleUpdateStatus(order, "dikirim")
                                }
                                disabled={processingId === order.id}
                                className="px-3 py-1.5 bg-seller-primary text-white rounded-lg text-xs font-bold hover:bg-seller-primary-hover transition-colors disabled:opacity-60"
                              >
                                Kirim
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-seller-hairline flex items-center justify-between text-xs text-seller-textsecondary bg-[#F9F8F6]">
            <span>
              Menampilkan {visible.length} dari {orders.length} pesanan
            </span>
          </div>
        </div>
      </div>

      {/* Modal Tolak Pesanan */}
      {rejectingOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-seller-surfacewhite w-full max-w-sm rounded-2xl border border-seller-hairline overflow-hidden animate-fade-in shadow-xl">
            <div className="p-4 border-b border-seller-hairline flex justify-between items-center">
              <h3 className="font-bold text-seller-textprimary">
                Tolak Pesanan
              </h3>
              <button
                onClick={() => setRejectingOrder(null)}
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
            <div className="p-5 space-y-4">
              <p className="text-sm text-seller-textsecondary">
                Masukkan alasan penolakan untuk pesanan{" "}
                <span className="font-bold text-seller-textprimary">
                  #
                  {rejectingOrder.order_number ??
                    rejectingOrder.id.slice(0, 8).toUpperCase()}
                </span>
                .
              </p>
              <textarea
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Mis: Stok habis, produk tidak tersedia saat ini."
                className="w-full px-3 py-2 bg-seller-warmbg border border-seller-hairline rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-seller-primary resize-none"
              />
              {actionError && (
                <p className="text-xs text-red-600 font-semibold">
                  {actionError}
                </p>
              )}
            </div>
            <div className="p-4 border-t border-seller-hairline flex justify-end gap-3 bg-[#F9F8F6]">
              <button
                onClick={() => setRejectingOrder(null)}
                className="px-4 py-2 text-xs font-bold text-seller-textsecondary hover:text-seller-textprimary"
              >
                Batal
              </button>
              <button
                onClick={() =>
                  handleProcess(rejectingOrder, "ditolak", rejectionReason)
                }
                disabled={
                  processingId === rejectingOrder.id || !rejectionReason.trim()
                }
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-60"
              >
                {processingId === rejectingOrder.id
                  ? "Memproses..."
                  : "Konfirmasi Tolak"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="p-10 text-center animate-pulse text-seller-textsecondary">
          Memuat data pesanan...
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}
