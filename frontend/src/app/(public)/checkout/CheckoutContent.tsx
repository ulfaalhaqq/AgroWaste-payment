"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LeafletMap, LeafletMarker, LeafletWindow, LeafletMouseEvent } from "@/types/leaflet";
import {
  Check,
  MapPin,
  Truck,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  Package,
  Leaf,
  Navigation,
  Locate,
} from "lucide-react";
import { apiFetch, getProductImageUrl } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { calculateDeliveryCost, calculateDistanceKm } from "@/lib/location";

interface CartProduct {
  id: string;
  name: string;
  price: string;
  unit: string;
  min_order_kg: string;
  image_url?: string | null;
  peternak?: {
    peternak_profile?: {
      lat?: string | number | null;
      lng?: string | number | null;
    };
  };
}

interface CartItem {
  id: string;
  product_id: string;
  quantity_kg: string;
  product: CartProduct & {
    peternak_profile?: { bank_account?: string | null };
  };
}

interface CheckoutOrder {
  order_number: string;
  total_price: string | number;
  status: string;
  metode_pengiriman: string;
  metode_pembayaran: string;
}

function formatRupiah(n: string | number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(n));
}

const EST_SHIPPING = 24500;

export default function CheckoutContent() {
  const router = useRouter();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState(true);
  const [cartError, setCartError] = useState<string | null>(null);
  const [metodePengiriman, setMetodePengiriman] = useState<
    "pickup" | "logistik"
  >("pickup");
  const [metodePembayaran, setMetodePembayaran] = useState<"manual" | "cod">(
    "manual",
  );
  const [alamatPengiriman, setAlamatPengiriman] = useState("");
  const [gisLat, setGisLat] = useState<string | number>("-7.892400");
  const [gisLng, setGisLng] = useState<string | number>("112.656300");
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);
  const [markerInstance, setMarkerInstance] = useState<LeafletMarker | null>(null);
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<CheckoutOrder | null>(null);

  // lazy-load Leaflet CDN for Checkout GIS Map
  useEffect(() => {
    const cssId = "leaflet-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const jsId = "leaflet-js";
    if (!document.getElementById(jsId)) {
      const script = document.createElement("script");
      script.id = jsId;
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => setLeafletLoaded(true);
      document.body.appendChild(script);
    } else {
      if ((window as unknown as LeafletWindow).L) {
        setLeafletLoaded(true);
      }
    }
  }, []);

  useEffect(() => {
    if (!leafletLoaded || cartLoading || metodePengiriman !== "logistik")
      return;
    const mapElement = document.getElementById("checkout-gis-map");
    if (!mapElement) return;

    const L = (window as unknown as LeafletWindow).L;
    if (!L) return;

    const initLat = Number(gisLat) || -7.8924;
    const initLng = Number(gisLng) || 112.6563;

    const map = L.map("checkout-gis-map").setView([initLat, initLng], 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    const marker = L.marker([initLat, initLng], { draggable: true }).addTo(map);

    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      setGisLat(pos.lat.toFixed(6));
      setGisLng(pos.lng.toFixed(6));
    });

    map.on("click", (e: LeafletMouseEvent) => {
      const coords = e.latlng;
      marker.setLatLng(coords);
      setGisLat(coords.lat.toFixed(6));
      setGisLng(coords.lng.toFixed(6));
    });

    setMapInstance(map);
    setMarkerInstance(marker);
  }, [leafletLoaded, cartLoading, metodePengiriman]);

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const latStr = pos.coords.latitude.toFixed(6);
          const lngStr = pos.coords.longitude.toFixed(6);
          setGisLat(latStr);
          setGisLng(lngStr);

          if (mapInstance && markerInstance) {
            const newLat = Number(latStr);
            const newLng = Number(lngStr);
            markerInstance.setLatLng([newLat, newLng]);
            mapInstance.setView([newLat, newLng], 15);
          }
        },
        () => {
          alert(
            "Gagal mengakses lokasi GPS. Pastikan izin lokasi diaktifkan pada peramban Anda.",
          );
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    } else {
      alert("Fitur GPS lokasi tidak didukung pada peramban Anda.");
    }
  };

  useEffect(() => {
    if (!getToken()) {
      router.push("/login?callbackUrl=/checkout");
      return;
    }
    apiFetch("/cart-items")
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat keranjang.");
        return res.json();
      })
      .then((json) => {
        setCartItems(json.data as CartItem[]);
        setCartLoading(false);
      })
      .catch((err: Error) => {
        setCartError(err.message);
        setCartLoading(false);
      });
  }, [router]);

  useEffect(() => {
    if (!successOrder) return;
    const timer = setTimeout(() => router.push("/pesanan"), 4000);
    return () => clearTimeout(timer);
  }, [successOrder, router]);

  const subtotal = cartItems.reduce(
    (acc, item) => acc + Number(item.product.price) * Number(item.quantity_kg),
    0,
  );

  const totalWeightKg = cartItems.reduce(
    (acc, item) => acc + Number(item.quantity_kg),
    0,
  );

  let sellerLat = -7.9839;
  let sellerLng = 112.6214;
  const firstPeternakProfile =
    cartItems[0]?.product?.peternak_profile ??
    (cartItems[0]?.product as any)?.peternakProfile ??
    cartItems[0]?.product?.peternak?.peternak_profile;
  if (firstPeternakProfile?.lat && firstPeternakProfile?.lng) {
    sellerLat = Number(firstPeternakProfile.lat);
    sellerLng = Number(firstPeternakProfile.lng);
  }

  const userLat = Number(gisLat) || -7.898453;
  const userLng = Number(gisLng) || 112.653688;
  const distanceKm = calculateDistanceKm(sellerLat, sellerLng, userLat, userLng);

  const shippingCalculation = calculateDeliveryCost(
    distanceKm > 0 ? distanceKm : 8.75,
    totalWeightKg > 0 ? totalWeightKg : 5,
  );
  const estimatedShippingCost = shippingCalculation.deliveryCostRaw || EST_SHIPPING;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (metodePengiriman === "logistik" && !alamatPengiriman.trim()) {
      setSubmitError("Masukkan alamat pengiriman untuk metode Logistik.");
      return;
    }

    if (metodePembayaran === "manual" && !proofImage) {
      setSubmitError(
        "Harap unggah bukti pembayaran untuk metode Transfer Manual.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const finalAlamat =
        metodePengiriman === "logistik"
          ? gisLat && gisLng
            ? `${alamatPengiriman.trim()} [Titik GIS: ${gisLat}, ${gisLng}]`
            : alamatPengiriman.trim()
          : null;

      const res = await apiFetch("/orders/checkout", {
        method: "POST",
        body: JSON.stringify({
          metode_pengiriman: metodePengiriman,
          metode_pembayaran: metodePembayaran,
          alamat_pengiriman: finalAlamat,
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setSubmitError(json.message ?? "Checkout gagal. Coba lagi.");
        return;
      }

      // If manual payment, upload proof
      if (metodePembayaran === "manual" && proofImage) {
        const orderData = json.data as { id: string };
        const orderId = orderData.id;

        const formData = new FormData();
        formData.append("order_id", orderId);
        formData.append("proof_image", proofImage);

        const token = getToken();
        const proofRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"}/payments/manual`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              // Don't set Content-Type for FormData, browser sets it with boundary
            },
            body: formData,
          },
        );

        const proofJson = await proofRes.json();
        if (!proofRes.ok || !proofJson.success) {
          setSubmitError(
            proofJson.message ??
              "Pesanan dibuat, tetapi gagal mengunggah bukti pembayaran.",
          );
          // We could return here, but order is already created. For MVP, just show error or proceed anyway.
        }
      }

      setSuccessOrder(json.data as CheckoutOrder);
      window.dispatchEvent(new Event("cart-change"));
    } catch {
      setSubmitError("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  /* success */
  if (successOrder) {
    return (
      <div className="flex-1 animate-fade-in pb-24 bg-land-bg flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md w-full mx-auto px-6 text-center">
          <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
            <div className="absolute inset-0 rounded-full bg-[#E6F5EC] animate-ping opacity-75"></div>
            <div className="absolute inset-2 bg-white rounded-full border-4 border-[#009A44] flex items-center justify-center shadow-md z-10">
              <Check className="w-10 h-10 text-[#009A44]" strokeWidth={3} />
            </div>
          </div>
          <h1 className="text-3xl font-land-heading font-bold text-[#00662D] mb-2">
            Pesanan Diterima!
          </h1>
          <p className="text-land-muted text-sm mb-8">
            Pesanan Anda sedang diproses oleh peternak.
          </p>

          <div className="bg-white border border-[#E8E0D5] rounded-[24px] p-6 mb-6 text-left space-y-3 text-sm shadow-sm">
            <div className="flex justify-between">
              <span className="text-land-muted">Nomor Pesanan</span>
              <span className="font-mono font-bold text-land-ink">
                {successOrder.order_number}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-land-muted">Total Pesanan</span>
              <span className="font-bold text-[#009A44] font-tabular">
                {formatRupiah(successOrder.total_price)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-land-muted">Metode Pengiriman</span>
              <span className="font-bold text-land-ink capitalize">
                {successOrder.metode_pengiriman}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-land-muted">Metode Pembayaran</span>
              <span className="font-bold text-land-ink">
                {successOrder.metode_pembayaran === "cod"
                  ? "COD (Bayar di Tempat)"
                  : "Transfer Manual"}
              </span>
            </div>
          </div>

          <Link
            href="/pesanan"
            className="btn-clay-primary py-3.5 w-full flex items-center justify-center gap-2 mb-3"
          >
            Lihat Riwayat Pesanan
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-xs text-land-muted">
            Mengarahkan otomatis dalam beberapa detik...
          </p>
        </div>
      </div>
    );
  }

  /* loading */
  if (cartLoading) {
    return (
      <div className="flex-1 animate-fade-in pb-24 bg-land-bg">
        <div className="bg-[#F0EDE6]/30 border-b border-[#E8E0D5]/60 py-6">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="h-10 bg-[#E8E0D5] rounded-full animate-pulse" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white border border-[#E8E0D5] rounded-[32px] p-8 animate-pulse h-44"
                />
              ))}
            </div>
            <div className="bg-white border border-[#E8E0D5] rounded-[32px] p-6 animate-pulse h-96" />
          </div>
        </div>
      </div>
    );
  }

  /* empty/error cart */
  if (cartError || cartItems.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center py-32">
        <div className="text-center">
          <Package className="w-12 h-12 text-[#E8E0D5] mx-auto mb-4" />
          <p className="text-land-muted font-bold text-lg mb-2">
            {cartError ?? "Keranjang kosong — tidak ada yang bisa di-checkout."}
          </p>
          <Link
            href="/marketplace"
            className="text-[#009A44] font-bold text-sm hover:underline"
          >
            ← Kembali ke Marketplace
          </Link>
        </div>
      </div>
    );
  }

  /* main form */
  return (
    <form
      onSubmit={handleSubmit}
      className="flex-1 animate-fade-in pb-24 bg-land-bg"
    >
      {/* Progress Bar Header */}
      <div className="bg-[#F0EDE6]/30 border-b border-[#E8E0D5]/60 py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex justify-between items-center relative">
          <div className="absolute left-[15%] right-[15%] top-4 sm:top-5 h-[2px] bg-[#E8E0D5]/70 -z-10"></div>

          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#009A44] text-white flex items-center justify-center font-bold shadow-sm ring-4 ring-[#E6F5EC]">
              <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-[#009A44]">
              Keranjang
            </span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#009A44] text-white flex items-center justify-center font-bold shadow-sm ring-4 ring-[#E6F5EC]">
              <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-[#009A44]">
              Pengiriman
            </span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border-2 border-[#009A44] text-[#009A44] flex items-center justify-center font-bold shadow-sm ring-4 ring-white">
              3
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-land-ink">
              Pembayaran
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Method */}
            <div className="bg-white border border-[#E8E0D5]/60 rounded-[32px] p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-2.5 mb-6">
                <Truck className="w-5 h-5 text-land-clay" />
                <h2 className="text-xl font-bold text-land-ink font-land-heading">
                  Metode Pengiriman
                </h2>
              </div>

              <div className="space-y-4">
                {/* Pickup */}
                <button
                  type="button"
                  onClick={() => setMetodePengiriman("pickup")}
                  className={`w-full relative rounded-2xl p-5 cursor-pointer text-left transition-all duration-200 shadow-sm border-2 ${
                    metodePengiriman === "pickup"
                      ? "bg-[#E6F5EC]/50 border-[#009A44]"
                      : "bg-white border-[#E8E0D5]/60 hover:border-land-clay"
                  }`}
                >
                  {metodePengiriman === "pickup" && (
                    <div className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-[#009A44] rounded-full text-white flex items-center justify-center shadow-sm">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="flex justify-between items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3
                          className={`font-bold text-sm ${metodePengiriman === "pickup" ? "text-[#009A44]" : "text-land-ink"}`}
                        >
                          Ambil Sendiri (Pickup)
                        </h3>
                        <span className="px-2.5 py-0.5 bg-[#009A44] text-white text-[8px] font-bold tracking-widest uppercase rounded-full">
                          Gratis
                        </span>
                      </div>
                      <p className="text-xs text-land-muted">
                        Ambil langsung di lokasi peternak. Jadwal
                        dikoordinasikan bersama peternak.
                      </p>
                    </div>
                    <div className="text-lg font-bold text-[#009A44] font-tabular shrink-0">
                      Rp 0
                    </div>
                  </div>
                </button>

                {/* Logistik */}
                <button
                  type="button"
                  onClick={() => setMetodePengiriman("logistik")}
                  className={`w-full relative rounded-2xl p-5 cursor-pointer text-left transition-all duration-200 shadow-sm border-2 ${
                    metodePengiriman === "logistik"
                      ? "bg-[#E6F5EC]/50 border-[#009A44]"
                      : "bg-white border-[#E8E0D5]/60 hover:border-land-clay"
                  }`}
                >
                  {metodePengiriman === "logistik" && (
                    <div className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-[#009A44] rounded-full text-white flex items-center justify-center shadow-sm">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="flex justify-between items-center gap-4">
                    <div>
                      <h3
                        className={`font-bold text-sm mb-1.5 ${metodePengiriman === "logistik" ? "text-[#009A44]" : "text-land-ink"}`}
                      >
                        Dikirim via Logistik
                      </h3>
                      <p className="text-xs text-land-muted">
                        Dikirim ke alamat tujuan. Estimasi tiba 1–3 hari kerja.
                      </p>
                    </div>
                    <div className="text-sm font-bold text-land-muted font-tabular shrink-0">
                      Ongkir berlaku
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Shipping Address & GIS Map — logistik only */}
            {metodePengiriman === "logistik" && (
              <div className="bg-white border border-[#E8E0D5]/60 rounded-[32px] p-6 md:p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-5 h-5 text-[#009A44]" />
                    <h2 className="text-xl font-bold text-land-ink font-land-heading">
                      Alamat Pengiriman & Titik GIS
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    className="text-xs font-bold text-[#009A44] hover:underline flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E6F5EC] border border-[#009A44]/20 transition-all hover:bg-[#009A44] hover:text-white group"
                  >
                    <Navigation className="w-3.5 h-3.5 text-[#009A44] group-hover:text-white transition-colors" />
                    <span>Gunakan Lokasi Saya</span>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-land-muted uppercase tracking-wider mb-2">
                    Alamat Lengkap *
                  </label>
                  <textarea
                    required
                    value={alamatPengiriman}
                    onChange={(e) => setAlamatPengiriman(e.target.value)}
                    rows={3}
                    placeholder="Contoh: Jl. Merdeka No. 123, Kel. Babakan, Kec. Bogor Tengah, Kota Bogor, Jawa Barat 16121"
                    className="block w-full rounded-2xl border border-[#E8E0D5] py-3.5 px-4 text-[#111111] placeholder:text-gray-400 focus:ring-2 focus:ring-[#009A44] focus:border-[#009A44] text-sm bg-[#F0EDE6]/20 shadow-sm transition-colors resize-none"
                  />
                </div>

                {/* Interactive GIS Map Picker */}
                <div className="space-y-3 pt-2 border-t border-dashed border-[#E8E0D5]">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-land-ink">
                      Tentukan Pin Titik Lokasi Presisi (Peta GIS)
                    </span>
                    <span className="text-[11px] font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                      {gisLat}, {gisLng}
                    </span>
                  </div>
                  <p className="text-xs text-land-muted">
                    Klik pada peta atau geser marker ke lokasi tujuan. Koordinat
                    GIS presisi ini akan otomatis dikirimkan langsung ke peta
                    navigasi mitra kurir.
                  </p>
                  <div className="w-full h-[260px] rounded-2xl overflow-hidden border border-[#E8E0D5] relative shadow-inner bg-[#F0EDE6]">
                    {leafletLoaded ? (
                      <div
                        id="checkout-gis-map"
                        className="w-full h-full z-0"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-land-muted animate-pulse">
                        Memuat Peta GIS...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="bg-white border border-[#E8E0D5]/60 rounded-[32px] p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-2.5 mb-6">
                <CreditCard className="w-5 h-5 text-land-ink" />
                <h2 className="text-xl font-bold text-land-ink font-land-heading">
                  Metode Pembayaran
                </h2>
              </div>

              <div className="space-y-4">
                {/* Transfer Manual */}
                <button
                  type="button"
                  onClick={() => setMetodePembayaran("manual")}
                  className={`w-full relative rounded-2xl p-5 cursor-pointer text-left transition-all duration-200 shadow-sm border-2 ${
                    metodePembayaran === "manual"
                      ? "bg-[#E6F5EC]/50 border-[#009A44]"
                      : "bg-white border-[#E8E0D5]/60 hover:border-land-clay"
                  }`}
                >
                  {metodePembayaran === "manual" && (
                    <div className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-[#009A44] rounded-full text-white flex items-center justify-center shadow-sm">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="flex gap-4">
                    <div className="w-5 h-5 rounded-full border-4 border-[#009A44] flex-shrink-0 bg-white mt-0.5" />
                    <div className="flex-1">
                      <h3
                        className={`font-bold text-sm ${metodePembayaran === "manual" ? "text-land-ink" : "text-land-ink"}`}
                      >
                        Transfer Manual
                      </h3>
                      <p className="text-xs text-land-muted mt-1">
                        Transfer via Bank. Wajib mengunggah bukti pembayaran.
                      </p>

                      {metodePembayaran === "manual" && (
                        <div
                          className="mt-4 p-4 bg-white rounded-xl border border-[#009A44]/20"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="mb-3">
                            <span className="block text-[10px] text-land-muted font-bold uppercase tracking-wider mb-1">
                              Rekening Tujuan
                            </span>
                            <div className="font-bold text-sm text-land-ink">
                              {cartItems[0]?.product.peternak_profile
                                ?.bank_account ||
                                "Menunggu informasi rekening dari penjual"}
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] text-land-muted font-bold uppercase tracking-wider mb-1">
                              Upload Bukti Pembayaran *
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                if (
                                  e.target.files &&
                                  e.target.files.length > 0
                                ) {
                                  setProofImage(e.target.files[0]);
                                }
                              }}
                              className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#009A44]/10 file:text-[#009A44] hover:file:bg-[#009A44]/20"
                            />
                            {proofImage && (
                              <p className="text-xs text-[#009A44] mt-2 font-semibold">
                                File dipilih: {proofImage.name}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </button>

                {/* COD */}
                <button
                  type="button"
                  onClick={() => setMetodePembayaran("cod")}
                  className={`w-full relative rounded-2xl p-5 cursor-pointer text-left transition-all duration-200 shadow-sm border-2 ${
                    metodePembayaran === "cod"
                      ? "bg-[#E6F5EC]/50 border-[#009A44]"
                      : "bg-white border-[#E8E0D5]/60 hover:border-land-clay"
                  }`}
                >
                  {metodePembayaran === "cod" && (
                    <div className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-[#009A44] rounded-full text-white flex items-center justify-center shadow-sm">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="flex gap-4">
                    <div
                      className={`w-5 h-5 rounded-full border-4 flex-shrink-0 mt-0.5 ${metodePembayaran === "cod" ? "border-[#009A44] bg-white" : "border-[#E8E0D5] bg-transparent"}`}
                    />
                    <div className="flex-1">
                      <h3
                        className={`font-bold text-sm ${metodePembayaran === "cod" ? "text-land-ink" : "text-land-ink"}`}
                      >
                        COD (Bayar di Tempat)
                      </h3>
                      <p className="text-xs text-land-muted mt-1">
                        Bayar langsung ke kurir atau peternak saat pesanan tiba.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
              <p className="text-[10px] text-land-muted mt-3">
                Metode pembayaran lain (QRIS, VA) segera hadir.
              </p>
            </div>

            {/* Error Banner */}
            {submitError && (
              <div className="rounded-2xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700 font-medium">
                {submitError}
              </div>
            )}
          </div>

          {/* Right Column — Billing Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-[#E8E0D5]/80 rounded-[32px] p-6 shadow-sm sticky top-28">
              <h2 className="text-xl font-bold text-land-ink font-land-heading mb-6">
                Ringkasan Pesanan
              </h2>

              {/* Product list preview */}
              <div className="space-y-4 mb-6 max-h-52 overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#F0F5F1] border border-[#E8E0D5]/40 shrink-0 overflow-hidden flex items-center justify-center">
                      {item.product.image_url ? (
                        <img
                          src={getProductImageUrl(item.product.image_url)}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Leaf className="w-5 h-5 text-[#009A44]/20" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-land-ink text-xs truncate">
                        {item.product.name}
                      </h4>
                      <div className="flex justify-between mt-1 text-[10px]">
                        <span className="text-land-muted">
                          {item.quantity_kg} {item.product.unit}
                        </span>
                        <span className="font-bold text-land-ink font-tabular">
                          {formatRupiah(
                            Number(item.product.price) *
                              Number(item.quantity_kg),
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bill Breakdown */}
              <div className="space-y-3 text-sm border-t border-dashed border-[#E8E0D5] pt-6 mb-6">
                <div className="flex justify-between">
                  <span className="text-land-muted">Subtotal Produk</span>
                  <span className="font-bold text-land-ink font-tabular">
                    {formatRupiah(subtotal)}
                  </span>
                </div>
                {metodePengiriman === "logistik" && (
                  <div className="flex justify-between text-xs">
                    <span className="text-land-muted">
                      Ongkir{" "}
                      <em className="not-italic opacity-70">(estimasi)</em>
                    </span>
                    <span className="font-bold text-land-muted font-tabular">
                      {formatRupiah(estimatedShippingCost)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center border-t border-[#E8E0D5]/60 pt-6 mb-1">
                <span className="font-bold text-land-ink">Total Tagihan</span>
                <span className="text-2xl font-bold text-[#009A44] font-tabular">
                  {formatRupiah(subtotal)}
                </span>
              </div>
              {metodePengiriman === "logistik" ? (
                <div className="bg-red-50/80 border border-red-200 rounded-2xl p-4 my-4 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between border-b border-red-200/60 pb-2">
                    <div className="flex items-center gap-2 text-red-700">
                      <Truck className="w-4 h-4 text-red-600 shrink-0" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Catatan Ongkos Kirim
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 bg-red-100 border border-red-200 text-red-700 font-bold text-xs rounded-lg font-tabular">
                      +{formatRupiah(estimatedShippingCost)}
                    </span>
                  </div>

                  <div className="text-xs text-red-800 space-y-1.5 pt-0.5">
                    <div className="flex items-start gap-1.5">
                      <span className="text-red-500 font-bold">•</span>
                      <span>
                        Dihitung terpisah via kalkulator logistik ({shippingCalculation.vehicleType} · {distanceKm.toFixed(1)} km)
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-red-500 font-bold">•</span>
                      <span className="font-bold text-red-700">
                        Dibayarkan langsung saat barang diterima di tempat
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-6" />
              )}

              {/* CTA */}
              <button
                type="submit"
                disabled={submitting}
                className="btn-clay-primary py-4 w-full flex items-center justify-center gap-2 mb-6 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
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
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <>
                    Konfirmasi Pesanan
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="text-center text-[9px] text-land-muted font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 opacity-80">
                <ShieldCheck className="w-3.5 h-3.5 text-[#009A44]" />
                Layanan Keamanan AgroWaste Pay
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
