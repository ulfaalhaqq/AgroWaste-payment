"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Truck, ShieldCheck } from "lucide-react";
import MapTracking from "@/components/public/MapTracking";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

function formatDateTime(dateStr?: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
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

interface TrackingOrderUser {
  id: string;
  name: string;
  email: string;
  role?: string;
  phone?: string | null;
  avatar_url?: string | null;
}

interface TrackingPeternakProfile {
  id: string;
  user_id: string;
  nama_kandang?: string;
  nama_peternakan?: string;
  jenis_ternak?: string[];
  kapasitas_ternak?: number | null;
  deskripsi?: string | null;
  provinsi?: string;
  kabupaten?: string;
  kecamatan?: string;
  lat?: number | string | null;
  lng?: number | string | null;
  total_sold_kg?: number | string;
  badge?: string;
  bank_account?: string | null;
}

interface TrackingLogistikProfile {
  id: string;
  user_id: string;
  company_name?: string | null;
  vehicle_plate?: string | null;
  plat_nomor?: string | null;
  vehicle_type?: string | null;
  lat?: number | string | null;
  lng?: number | string | null;
  alamat_posisi?: string | null;
  kecamatan?: string | null;
  kabupaten?: string | null;
  provinsi?: string | null;
  user?: TrackingOrderUser;
}

interface TrackingShipment {
  id: string;
  order_id: string;
  logistik_profile_id: string;
  status: string;
  tracking_notes?: string | null;
  created_at?: string;
  updated_at?: string;
  logistik_profile?: TrackingLogistikProfile;
}

interface TrackingOrderProduct {
  id: string;
  name: string;
  image_url?: string | null;
}

interface TrackingOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity_kg: number | string;
  price_per_kg: number | string;
  product?: TrackingOrderProduct;
}

interface TrackingReview {
  id: string;
  user_id: string;
  product_id: string;
  order_id?: string | null;
  rating: number;
  comment: string | null;
  created_at?: string;
  updated_at?: string;
  user?: { id: string; name: string; email: string };
}

interface TrackingOrder {
  id: string;
  order_number?: string | null;
  user_id?: string | null;
  peternak_id?: string | null;
  buyer_profile_id?: string | null;
  product_id?: string | null;
  quantity_kg?: number | string;
  total_price: number | string;
  delivery_address?: string | null;
  status: string;
  rejection_reason?: string | null;
  metode_pengiriman?: string | null;
  metode_pembayaran?: string | null;
  alamat_pengiriman?: string | null;
  created_at: string;
  updated_at?: string;
  items?: TrackingOrderItem[];
  product?: TrackingOrderProduct | null;
  reviews?: TrackingReview[];
  peternak?: (TrackingOrderUser & {
    peternak_profile?: TrackingPeternakProfile | null;
  }) | null;
  shipment?: TrackingShipment | null;
  payment?: {
    id: string;
    status?: string;
    proof?: { id: string; file_url?: string } | null;
  } | null;
}

export default function LacakPesananPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const rawId = params?.id || "";

  const [order, setOrder] = useState<TrackingOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Lacak Pengiriman | AgroWaste";
    if (!getToken()) {
      router.push("/login?callbackUrl=/pesanan");
      return;
    }
    if (!rawId) return;

    setLoading(true);
    apiFetch(`/orders/${rawId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat data pelacakan pesanan.");
        return res.json();
      })
      .then((json) => {
        if (json?.data) {
          setOrder(json.data);
        } else {
          throw new Error("Data pesanan tidak ditemukan.");
        }
      })
      .catch((err: Error) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [rawId, router]);

  const displayOrderId =
    order?.order_number ||
    (rawId
      ? rawId.startsWith("AGW-")
        ? rawId
        : `AGW-${rawId.slice(0, 8).toUpperCase()}`
      : "AGW-PESANAN");

  // Extract Peternak Coords (Start Coords: [lng, lat])
  let pLat = -7.9839;
  let pLng = 112.6214;
  const peternakProfile = order?.peternak?.peternak_profile;
  if (peternakProfile?.lat && peternakProfile?.lng) {
    pLat = Number(peternakProfile.lat);
    pLng = Number(peternakProfile.lng);
  }

  // Extract Buyer Coords (End Coords: [lng, lat])
  let dLat = pLat - 0.015;
  let dLng = pLng - 0.025;
  const alamat = order?.alamat_pengiriman || "";
  const gisMatch = alamat.match(
    /\[Titik GIS:\s*(-?\d+\.\d+),\s*(-?\d+\.\d+)\]/i
  );
  if (gisMatch) {
    dLat = Number(gisMatch[1]);
    dLng = Number(gisMatch[2]);
  }

  // Courier Coords (Midpoint: [lng, lat])
  const cLat = (pLat + dLat) / 2;
  const cLng = (pLng + dLng) / 2;

  const courierName =
    order?.shipment?.logistik_profile?.user?.name ||
    order?.shipment?.logistik_profile?.company_name ||
    "Mitra Kurir AgroWaste";

  const courierCompany =
    order?.shipment?.logistik_profile?.company_name ||
    "Mitra Logistik Terverifikasi";

  const platNomor =
    order?.shipment?.logistik_profile?.plat_nomor || "N 1234 AG";

  const vehicleType =
    order?.shipment?.logistik_profile?.vehicle_type || "Motor / Pickup";

  const isShipped =
    order?.status === "dikirim" ||
    order?.shipment?.status === "sedang_berjalan" ||
    order?.shipment?.status === "dalam_perjalanan";

  const isCompleted =
    order?.status === "selesai" ||
    order?.shipment?.status === "terkirim" ||
    order?.shipment?.status === "selesai";

  return (
    <div className="flex-1 animate-fade-in bg-land-warm min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 md:pt-10">
        {/* Header & Back Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/pesanan"
              className="w-12 h-12 rounded-full bg-white border border-[#E8E0D5] flex items-center justify-center text-land-ink hover:border-[#009A44] hover:text-[#009A44] transition-colors shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-land-heading font-bold text-land-ink">
                Lacak Pengiriman Real-Time
              </h1>
              <p className="text-sm text-land-muted">
                ID Pesanan:{" "}
                <span className="font-mono font-bold text-land-ink">
                  {displayOrderId}
                </span>
              </p>
            </div>
          </div>

          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm ${
              isCompleted
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                : isShipped
                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                  : "bg-blue-100 text-blue-800 border border-blue-300"
            }`}
          >
            <Truck className="w-4 h-4" />
            {isCompleted
              ? "Pesanan Telah Tiba"
              : isShipped
                ? "Sedang Dalam Perjalanan"
                : "Pesanan Sedang Diproses"}
          </div>
        </div>

        {loading ? (
          <div className="bg-white border border-[#E8E0D5] rounded-[32px] p-16 text-center shadow-sm animate-pulse">
            <div className="w-12 h-12 border-4 border-[#009A44] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-land-muted font-bold">Memuat data pelacakan pengiriman...</p>
          </div>
        ) : error ? (
          <div className="bg-white border border-[#E8E0D5] rounded-[32px] p-12 text-center shadow-sm">
            <p className="text-red-600 font-bold mb-4">{error}</p>
            <Link href="/pesanan" className="btn-clay-primary px-6 py-2.5 inline-block text-sm">
              Kembali ke Pesanan
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Kiri: Peta & Profile Kurir */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Map Container */}
              <div className="bg-white p-2.5 rounded-[40px] shadow-sm border border-[#E8E0D5] overflow-hidden">
                <div className="w-full h-[400px] md:h-[500px] rounded-[32px] overflow-hidden relative bg-[#E8E0D5]">
                  <MapTracking
                    startCoords={[pLng, pLat]}
                    endCoords={[dLng, dLat]}
                    courierCoords={[cLng, cLat]}
                    className="w-full h-full"
                  />
                </div>
              </div>

              {/* Courier Profile */}
              <div className="bg-[#1C231F] rounded-[32px] p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-lg relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-[#009A44] rounded-full filter blur-[100px] opacity-20 pointer-events-none translate-x-1/2 -translate-y-1/2" />

                <div className="flex items-center gap-5 relative z-10">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#E8E0D5] p-1 border border-white/20 shrink-0">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(courierName)}&background=009A44&color=fff`}
                      alt={courierName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-land-heading font-bold text-xl">
                        {courierName}
                      </h3>
                      <ShieldCheck className="w-5 h-5 text-[#4ADE80]" />
                    </div>
                    <p className="text-white/70 text-sm mb-3">
                      {courierCompany}
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-[#4ADE80] tracking-widest uppercase border border-white/10">
                        {platNomor}
                      </span>
                      <span className="text-white/70 text-xs flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5" /> {vehicleType}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Kanan: Timeline Riwayat Perjalanan */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-[#E8E0D5] rounded-[32px] p-6 md:p-8 shadow-sm sticky top-24">
                <h2 className="font-land-heading text-xl font-bold text-land-ink mb-8">
                  Riwayat Perjalanan
                </h2>

                <div className="relative pl-7 space-y-10">
                  {/* Garis vertikal background */}
                  <div className="absolute left-[13px] top-2 bottom-6 w-0.5 bg-[#E8E0D5]" />
                  {/* Garis vertikal hijau progres */}
                  <div
                    className="absolute left-[13px] top-2 w-0.5 bg-[#009A44] transition-all duration-500"
                    style={{
                      height: isCompleted
                        ? "100%"
                        : isShipped
                          ? "75%"
                          : "45%",
                    }}
                  />

                  {/* Step 1: Pesanan Dibuat */}
                  <div className="relative">
                    <div className="absolute -left-[35px] top-0.5 w-4 h-4 rounded-full bg-[#009A44] ring-4 ring-white z-10" />
                    <h4 className="font-bold text-land-ink text-sm">
                      Pesanan Dibuat
                    </h4>
                    <p className="text-xs text-land-muted mt-1">
                      {formatDateTime(order?.created_at)}
                    </p>
                  </div>

                  {/* Step 2: Pembayaran Berhasil */}
                  <div className="relative">
                    <div className="absolute -left-[35px] top-0.5 w-4 h-4 rounded-full bg-[#009A44] ring-4 ring-white z-10" />
                    <h4 className="font-bold text-land-ink text-sm">
                      Pembayaran Berhasil
                    </h4>
                    <p className="text-xs text-land-muted mt-1">
                      {formatDateTime(order?.created_at)}
                    </p>
                  </div>

                  {/* Step 3: Pesanan Sedang Disiapkan */}
                  <div className="relative">
                    <div className="absolute -left-[35px] top-0.5 w-4 h-4 rounded-full bg-[#009A44] ring-4 ring-white z-10" />
                    <h4 className="font-bold text-land-ink text-sm">
                      Pesanan Sedang Disiapkan
                    </h4>
                    <p className="text-xs text-land-muted mt-1 leading-relaxed">
                      {formatDateTime(order?.created_at)}
                      <br />
                      Peternak ({order?.peternak?.peternak_profile?.nama_peternakan || order?.peternak?.name || "Mitra Peternak"}) sedang mengemas barang Anda.
                    </p>
                  </div>

                  {/* Step 4: Sedang Dikirim */}
                  <div className={`relative ${isShipped || isCompleted ? "opacity-100" : "opacity-50"}`}>
                    <div
                      className={`absolute -left-[45px] -top-2 w-10 h-10 rounded-full flex items-center justify-center ring-4 ring-white shadow-sm z-10 ${
                        isShipped && !isCompleted
                          ? "bg-amber-100 text-amber-700 font-bold"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      <Truck className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-land-ink text-base">
                      Sedang Dikirim
                    </h4>
                    <p className="text-xs text-land-muted mt-1 leading-relaxed">
                      {formatDateTime(order?.shipment?.updated_at || order?.updated_at)}
                      <br />
                      {order?.shipment?.tracking_notes ||
                        `${courierName} sedang dalam perjalanan mengantar barang ke alamat Anda.`}
                    </p>
                  </div>

                  {/* Step 5: Pesanan Diterima */}
                  <div className={`relative ${isCompleted ? "opacity-100" : "opacity-40"}`}>
                    <div
                      className={`absolute -left-[35px] top-0.5 w-4 h-4 rounded-full ring-4 ring-white z-10 ${
                        isCompleted ? "bg-[#009A44]" : "bg-[#E8E0D5]"
                      }`}
                    />
                    <h4 className="font-bold text-land-ink text-sm">
                      Pesanan Diterima
                    </h4>
                    <p className="text-xs text-land-muted mt-1">
                      {isCompleted
                        ? formatDateTime(order?.updated_at)
                        : "Estimasi tiba setelah kurir mengonfirmasi pengantaran."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
