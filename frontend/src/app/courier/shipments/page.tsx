"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Camera, CheckCircle, Upload } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { calculateDeliveryCost, calculateDistanceKm } from "@/lib/location";

interface OrderItem {
  id: string;
  quantity_kg?: string | number;
  product?: {
    name: string;
  };
}

interface Shipment {
  id: string;
  status: string;
  tracking_notes: string | null;
  created_at: string;
  order?: {
    id: string;
    order_number: string | null;
    alamat_pengiriman: string | null;
    total_price: string | number;
    quantity_kg?: string | number;
    user?: {
      name: string;
      phone?: string | null;
    };
    peternak?: {
      name: string;
      peternak_profile?: {
        nama_peternakan: string;
        lat: string | number | null;
        lng: string | number | null;
        kecamatan?: string | null;
        kabupaten?: string | null;
        provinsi?: string | null;
      };
    };
    order_items?: OrderItem[];
  };
}

interface ProofItem {
  isOngkirPaid: boolean;
  fotoPickup: string | null;
  fotoDelivery: string | null;
}

function formatRupiah(n: string | number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(n));
}

function getOrderShippingCost(shipment: Shipment): number {
  const order = shipment.order;
  if (!order) return 24500;

  let weightKg = 5;
  if (order.quantity_kg) {
    weightKg = Number(order.quantity_kg) || 5;
  } else if (order.order_items && order.order_items.length > 0) {
    const sum = order.order_items.reduce(
      (acc, item) => acc + (Number(item.quantity_kg) || 0),
      0,
    );
    if (sum > 0) weightKg = sum;
  }

  // Base Origin (Penjual / Peternak Profile Coordinates)
  let pLat = -7.9839;
  let pLng = 112.6214;
  const peternakProfile = order.peternak?.peternak_profile;
  if (peternakProfile?.lat && peternakProfile?.lng) {
    pLat = Number(peternakProfile.lat);
    pLng = Number(peternakProfile.lng);
  }

  let dLat = pLat - 0.015;
  let dLng = pLng - 0.025;
  const alamat = order.alamat_pengiriman || "";
  const gisMatch = alamat.match(
    /\[Titik GIS:\s*(-?\d+\.\d+),\s*(-?\d+\.\d+)\]/i,
  );
  if (gisMatch) {
    dLat = Number(gisMatch[1]);
    dLng = Number(gisMatch[2]);
  }

  const distance = calculateDistanceKm(pLat, pLng, dLat, dLng);
  const cost = calculateDeliveryCost(distance, weightKg);
  return cost.deliveryCostRaw;
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

function getStatusBadge(status: string) {
  switch (status) {
    case "dijadwalkan":
      return {
        label: "Dijadwalkan",
        cls: "bg-blue-100 text-blue-800 font-semibold border border-blue-200",
      };
    case "sedang_berjalan":
    case "dalam_perjalanan":
    case "dikirim":
      return {
        label: "Sedang Berjalan",
        cls: "bg-amber-100 text-amber-800 font-semibold border border-amber-300",
      };
    case "selesai":
    case "terkirim":
      return {
        label: "Selesai",
        cls: "bg-green-100 text-green-800 font-semibold border border-green-300",
      };
    default:
      return { label: status, cls: "bg-[#EAE6E1] text-[#555555]" };
  }
}

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Semua");
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(
    null,
  );

  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [trackingNotes, setTrackingNotes] = useState("");
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{
    id: string;
    status: string;
  } | null>(null);

  // Proof photos & payment status map by shipment.id / order.id
  const [proofDataMap, setProofDataMap] = useState<Record<string, ProofItem>>(
    {},
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem("agrowaste_shipment_proofs");
      if (saved) {
        setProofDataMap(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Gagal memuat bukti pengiriman dari penyimpanan.", e);
    }
  }, []);

  const updateProofData = (id: string, updates: Partial<ProofItem>) => {
    setProofDataMap((prev) => {
      const current = prev[id] || {
        isOngkirPaid: false,
        fotoPickup: null,
        fotoDelivery: null,
      };
      const updated = { ...current, ...updates };
      const next = { ...prev, [id]: updated };
      try {
        localStorage.setItem("agrowaste_shipment_proofs", JSON.stringify(next));
      } catch (e) {
        console.error("Gagal menyimpan bukti pengiriman ke penyimpanan.", e);
      }
      return next;
    });
  };

  const fetchShipments = async () => {
    try {
      const res = await apiFetch("/logistik/shipments");
      const json = await res.json();
      if (res.ok && json.success) {
        const list = (json.data as Shipment[]) || [];
        setShipments(list);
        if (list.length > 0) {
          // keep previous selection or default to first
          setSelectedShipment((prev) => {
            const found = list.find((s) => s.id === prev?.id);
            return found || list[0];
          });
        }
      }
    } catch {
      console.error("Gagal memuat data pengiriman.");
    } finally {
      setLoading(false);
    }
  };

  // fetch on mount
  useEffect(() => {
    fetchShipments();
  }, []);

  // lazy-load Leaflet from CDN
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
      if (window.L) {
        setLeafletLoaded(true);
      }
    }
  }, []);

  // init/update map when selection changes
  useEffect(() => {
    if (!leafletLoaded) return;
    const L = window.L;
    if (!L) return;

    let map = mapInstance;
    if (!map) {
      const mapElem = document.getElementById("gis-map");
      if (!mapElem) return;
      map = L.map("gis-map").setView([-7.9839, 112.6214], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);
      setMapInstance(map);
    } else {
      // Hapus seluruh marker & jalur rute lama sebelum menggambar ulang
      map.eachLayer((layer: LeafletLayer) => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
          map?.removeLayer(layer);
        }
      });
    }

    // Jika tidak ada pengiriman yang dipilih / tab kosong, bersihkan titik peta!
    if (!selectedShipment) {
      map.setView([-7.9839, 112.6214], 12);
      return;
    }

    // Koordinat Penjemputan (Peternak) — Default area Malang
    let pLat = -7.9839;
    let pLng = 112.6214;
    const peternakProfile = selectedShipment.order?.peternak?.peternak_profile;
    if (peternakProfile?.lat && peternakProfile?.lng) {
      pLat = Number(peternakProfile.lat);
      pLng = Number(peternakProfile.lng);
    }

    // Koordinat Pengiriman (Pembeli) — Ekstrak dari alamat pengiriman jika ada titik GIS
    let dLat = pLat + 0.015;
    let dLng = pLng + 0.025;
    const alamat = selectedShipment.order?.alamat_pengiriman || "";
    const gisMatch = alamat.match(
      /\[Titik GIS:\s*(-?\d+\.\d+),\s*(-?\d+\.\d+)\]/i,
    );
    if (gisMatch) {
      dLat = Number(gisMatch[1]);
      dLng = Number(gisMatch[2]);
    }

    const pickupMarker = L.marker([pLat, pLng])
      .addTo(map)
      .bindPopup(
        `<b>Titik Penjemputan (Peternak):</b><br/>${peternakProfile?.nama_peternakan || selectedShipment.order?.peternak?.name || "Peternak"}`,
      );

    const deliveryMarker = L.marker([dLat, dLng])
      .addTo(map)
      .bindPopup(
        `<b>Titik Pengiriman (Pembeli):</b><br/>${selectedShipment.order?.user?.name || "Pembeli"}<br/>${alamat}`,
      );

    L.polyline(
      [
        [pLat, pLng],
        [dLat, dLng],
      ],
      {
        color: "#2F5A28",
        weight: 4,
        opacity: 0.8,
        dashArray: "5, 10",
      },
    ).addTo(map);

    pickupMarker.openPopup();

    const bounds = L.latLngBounds([
      [pLat, pLng],
      [dLat, dLng],
    ]);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [leafletLoaded, selectedShipment, mapInstance]);

  const visibleShipments = useMemo(() => {
    return shipments.filter((s) => {
      const isSedangBerjalan =
        s.status === "sedang_berjalan" ||
        s.status === "dalam_perjalanan" ||
        s.status === "dikirim";
      const isSelesai = s.status === "selesai" || s.status === "terkirim";
      const isDijadwalkan = s.status === "dijadwalkan";

      if (activeTab === "Sedang Berjalan" && !isSedangBerjalan) return false;
      if (activeTab === "Selesai" && !isSelesai) return false;
      if (activeTab === "Dijadwalkan" && !isDijadwalkan) return false;

      const num = s.order?.order_number || s.id;
      const dest = s.order?.alamat_pengiriman || "";
      const query = search.toLowerCase();
      return (
        num.toLowerCase().includes(query) || dest.toLowerCase().includes(query)
      );
    });
  }, [shipments, activeTab, search]);

  // Otomatis sinkronkan selectedShipment dengan daftar yang sedang aktif/tampil di tab
  useEffect(() => {
    if (visibleShipments.length === 0) {
      setSelectedShipment(null);
    } else if (
      !selectedShipment ||
      !visibleShipments.some((s) => s.id === selectedShipment.id)
    ) {
      setSelectedShipment(visibleShipments[0]);
    }
  }, [visibleShipments, selectedShipment]);

  const countByMatcher = (matcher: (status: string) => boolean) => {
    return shipments.filter((s) => matcher(s.status)).length;
  };

  const tabs = [
    { label: "Semua", count: shipments.length },
    {
      label: "Dijadwalkan",
      count: countByMatcher((st) => st === "dijadwalkan"),
    },
    {
      label: "Sedang Berjalan",
      count: countByMatcher(
        (st) =>
          st === "sedang_berjalan" ||
          st === "dalam_perjalanan" ||
          st === "dikirim",
      ),
    },
    {
      label: "Selesai",
      count: countByMatcher((st) => st === "selesai" || st === "terkirim"),
    },
  ];

  const handleUpdateStatus = async (
    id: string,
    newStatus: string,
    notes = "",
  ) => {
    setUpdatingId(id);
    try {
      const res = await apiFetch(`/logistik/shipments/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({
          status: newStatus,
          tracking_notes: notes || null,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        await fetchShipments();
      }
    } catch (e) {
      console.error("Gagal memperbarui status pengiriman.", e);
    } finally {
      setUpdatingId(null);
      setShowNotesModal(false);
      setPendingStatusUpdate(null);
      setTrackingNotes("");
    }
  };

  const openStatusConfirm = (id: string, status: string) => {
    setPendingStatusUpdate({ id, status });
    setTrackingNotes("");
    setShowNotesModal(true);
  };

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-courier-textprimary mb-1">
          Daftar Pengiriman
        </h2>
        <p className="text-sm text-courier-textsecondary">
          Kelola rute, navigasi GPS, dan laporkan status pengiriman Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Shipment List */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-courier-textsecondary">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  ></path>
                </svg>
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari ID Pesanan atau kota tujuan..."
                className="w-full pl-9 pr-4 py-2 bg-courier-surfacewhite border border-courier-hairline rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-courier-primary text-courier-textprimary shadow-sm"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-courier-hairline overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.label}
                onClick={() => setActiveTab(tab.label)}
                className={`px-6 py-3 font-semibold text-sm whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ${
                  activeTab === tab.label
                    ? "border-courier-primary text-courier-primary"
                    : "border-transparent text-courier-textsecondary hover:text-courier-textprimary hover:border-courier-hairline"
                }`}
              >
                {tab.label}
                <span
                  className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                    activeTab === tab.label
                      ? "bg-courier-primary text-white"
                      : "bg-[#EAE6E1] text-courier-textsecondary"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Shipment Cards */}
          <div className="space-y-4">
            {loading && (
              <div className="p-12 text-center text-courier-textsecondary text-sm animate-pulse">
                Memuat daftar pengiriman...
              </div>
            )}
            {!loading && visibleShipments.length === 0 && (
              <div className="p-12 text-center text-courier-textsecondary text-sm">
                Tidak ada jadwal pengiriman ditemukan.
              </div>
            )}
            {!loading &&
              visibleShipments.map((shipment) => {
                const { label, cls } = getStatusBadge(shipment.status);
                const orderNo =
                  shipment.order?.order_number ||
                  shipment.id.slice(0, 8).toUpperCase();
                const peternak = shipment.order?.peternak?.peternak_profile;
                const productTitle =
                  shipment.order?.order_items?.[0]?.product?.name ||
                  "Limbah Organik AgroWaste";
                const isSelected = selectedShipment?.id === shipment.id;

                return (
                  <div
                    key={shipment.id}
                    onClick={() => setSelectedShipment(shipment)}
                    className={`bg-courier-surfacewhite border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                      isSelected
                        ? "border-courier-primary ring-1 ring-courier-primary"
                        : "border-courier-hairline"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-courier-warmbg text-courier-primary rounded-xl flex items-center justify-center border border-courier-hairline shrink-0">
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                            />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-bold text-courier-textprimary text-lg">
                            #{orderNo}
                          </h3>
                          <p className="text-xs text-courier-textsecondary mt-0.5">
                            {formatDate(shipment.created_at)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5 ${cls}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {label}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      <div className="relative pl-6">
                        <div className="absolute left-1.5 top-2 bottom-2 w-0.5 border-l-2 border-dotted border-courier-hairline"></div>

                        <div className="relative mb-6">
                          <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-courier-primary border-2 border-white shadow-sm"></div>
                          <span className="text-[9px] font-bold text-courier-textsecondary tracking-wider uppercase block mb-1">
                            PICKUP (PETERNAK)
                          </span>
                          <h4 className="text-sm font-bold text-courier-textprimary">
                            {peternak?.nama_peternakan ||
                              shipment.order?.peternak?.name ||
                              "Peternak"}
                          </h4>
                          <p className="text-xs text-courier-textsecondary">
                            {peternak?.kecamatan || ""},{" "}
                            {peternak?.kabupaten || ""},{" "}
                            {peternak?.provinsi || ""}
                          </p>
                        </div>

                        <div className="relative">
                          <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-courier-primary border-2 border-white shadow-sm"></div>
                          <span className="text-[9px] font-bold text-courier-textsecondary tracking-wider uppercase block mb-1">
                            DELIVERY (PEMBELI)
                          </span>
                          <h4 className="text-sm font-bold text-courier-textprimary">
                            {shipment.order?.user?.name || "Pembeli"}
                          </h4>
                          <p
                            className="text-xs text-courier-textsecondary truncate"
                            title={shipment.order?.alamat_pengiriman || ""}
                          >
                            {shipment.order?.alamat_pengiriman ||
                              "Alamat tidak lengkap"}
                          </p>
                        </div>
                      </div>

                      <div className="bg-courier-warmbg/50 p-4 rounded-xl border border-courier-hairline/50">
                        <span className="text-[10px] font-bold text-courier-textsecondary tracking-wider uppercase block mb-2">
                          Item Pesanan
                        </span>
                        <h5 className="text-sm font-bold text-courier-primary mb-1">
                          {productTitle}
                        </h5>
                        <p className="text-xs text-courier-textsecondary">
                          Total Nilai:{" "}
                          {formatRupiah(shipment.order?.total_price || 0)}
                        </p>
                        {shipment.tracking_notes && (
                          <div className="mt-2 pt-2 border-t border-courier-hairline/50 text-[11px] text-courier-textsecondary">
                            <span className="font-bold text-courier-textprimary block">
                              Catatan Terakhir:
                            </span>
                            &quot;{shipment.tracking_notes}&quot;
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Proof Photos & Ongkir Payment Status Section */}
                    {(() => {
                      const proofKey = shipment.order?.id || shipment.id;
                      const proof = proofDataMap[proofKey] || {
                        isOngkirPaid: false,
                        fotoPickup: null,
                        fotoDelivery: null,
                      };

                      return (
                        <div className="mt-6 pt-5 border-t border-dashed border-courier-hairline space-y-4">
                          {/* Status Pembayaran Ongkir */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-courier-warmbg/40 p-4 rounded-xl border border-courier-hairline/60">
                            <div>
                              <span className="text-[10px] font-bold text-courier-textsecondary uppercase tracking-wider block mb-0.5">
                                Status Pembayaran Ongkir ({formatRupiah(getOrderShippingCost(shipment))})
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className={`text-xs font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                                    proof.isOngkirPaid
                                      ? "bg-green-100 text-green-700 border border-green-200"
                                      : "bg-amber-100 text-amber-800 border border-amber-200"
                                  }`}
                                >
                                  {proof.isOngkirPaid
                                    ? "LUNAS (DITERIMA KURIR)"
                                    : "BELUM DIBAYAR (COD ONGKIR)"}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateProofData(proofKey, {
                                  isOngkirPaid: !proof.isOngkirPaid,
                                });
                              }}
                              className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors border shadow-sm shrink-0 ${
                                proof.isOngkirPaid
                                  ? "bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                                  : "bg-[#009A44] hover:bg-emerald-700 text-white border-transparent"
                              }`}
                            >
                              {proof.isOngkirPaid
                                ? "Tandai Belum Lunas"
                                : "Tandai Ongkir LUNAS"}
                            </button>
                          </div>

                          {/* Uploaders Foto Bukti */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Bukti Foto Pengambilan */}
                            <div className="p-3.5 bg-white border border-courier-hairline rounded-xl space-y-2">
                              <span className="text-[10px] font-bold text-courier-textsecondary uppercase tracking-wider block">
                                Foto Bukti Pengambilan (Peternak)
                              </span>
                              {proof.fotoPickup ? (
                                <div className="relative rounded-lg overflow-hidden border border-courier-hairline h-32 bg-gray-100">
                                  <img
                                    src={proof.fotoPickup}
                                    alt="Bukti Pengambilan"
                                    className="w-full h-full object-cover"
                                  />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateProofData(proofKey, {
                                        fotoPickup: null,
                                      });
                                    }}
                                    className="absolute top-2 right-2 bg-black/70 text-white w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center hover:bg-red-600 transition-colors"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <label
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-courier-hairline rounded-lg bg-courier-warmbg/30 hover:bg-courier-warmbg cursor-pointer transition-colors text-center p-2"
                                >
                                  <Camera className="w-5 h-5 text-courier-textsecondary mb-1" />
                                  <span className="text-[11px] font-bold text-courier-primary">
                                    Unggah Foto Pickup
                                  </span>
                                  <span className="text-[9px] text-courier-textsecondary">
                                    Saat barang diambil dari peternak
                                  </span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          updateProofData(proofKey, {
                                            fotoPickup: reader.result as string,
                                          });
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                </label>
                              )}
                            </div>

                            {/* Bukti Foto Penyerahan */}
                            <div className="p-3.5 bg-white border border-courier-hairline rounded-xl space-y-2">
                              <span className="text-[10px] font-bold text-courier-textsecondary uppercase tracking-wider block">
                                Foto Bukti Penyerahan (Pembeli)
                              </span>
                              {proof.fotoDelivery ? (
                                <div className="relative rounded-lg overflow-hidden border border-courier-hairline h-32 bg-gray-100">
                                  <img
                                    src={proof.fotoDelivery}
                                    alt="Bukti Penyerahan"
                                    className="w-full h-full object-cover"
                                  />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateProofData(proofKey, {
                                        fotoDelivery: null,
                                      });
                                    }}
                                    className="absolute top-2 right-2 bg-black/70 text-white w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center hover:bg-red-600 transition-colors"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <label
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-courier-hairline rounded-lg bg-courier-warmbg/30 hover:bg-courier-warmbg cursor-pointer transition-colors text-center p-2"
                                >
                                  <Camera className="w-5 h-5 text-courier-textsecondary mb-1" />
                                  <span className="text-[11px] font-bold text-courier-primary">
                                    Unggah Foto Penyerahan
                                  </span>
                                  <span className="text-[9px] text-courier-textsecondary">
                                    Saat barang diterima oleh pembeli
                                  </span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          updateProofData(proofKey, {
                                            fotoDelivery:
                                              reader.result as string,
                                          });
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Actions buttons */}
                    <div className="mt-6 pt-5 border-t border-courier-hairline flex flex-wrap justify-between items-center gap-3">
                      {/* Hubungi Pembeli via WhatsApp */}
                      {(() => {
                        const buyerPhone = shipment.order?.user?.phone;
                        const buyerName = shipment.order?.user?.name || "Pembeli";
                        const orderNum = shipment.order?.order_number || shipment.id.substring(0, 8).toUpperCase();
                        if (!buyerPhone) return null;
                        const cleaned = buyerPhone.replace(/\D/g, "");
                        const waNumber = cleaned.startsWith("0") ? "62" + cleaned.slice(1) : cleaned.startsWith("62") ? cleaned : "62" + cleaned;
                        const waMsg = encodeURIComponent(`Halo ${buyerName}, saya kurir AgroWaste yang bertugas mengantarkan pesanan Anda (No. ${orderNum}). Paket menuju tujuan`);
                        return (
                          <a
                            href={`https://wa.me/${waNumber}?text=${waMsg}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.118 1.528 5.849L.057 23.885l6.224-1.632A11.955 11.955 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.372l-.359-.213-3.694.969.986-3.601-.234-.371A9.818 9.818 0 1112 21.818z"/>
                            </svg>
                            Hubungi Pembeli
                          </a>
                        );
                      })()}

                      <div className="flex items-center gap-3 ml-auto">
                        {shipment.status === "dijadwalkan" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openStatusConfirm(shipment.id, "sedang_berjalan");
                            }}
                            disabled={updatingId === shipment.id}
                            className="px-6 py-2.5 bg-courier-primary hover:bg-green-800 text-white rounded-xl text-sm font-bold transition-colors shadow-md shadow-courier-primary/20"
                          >
                            Mulai Pengiriman
                          </button>
                        )}
                        {(shipment.status === "sedang_berjalan" ||
                          shipment.status === "dalam_perjalanan" ||
                          shipment.status === "dikirim") && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openStatusConfirm(shipment.id, "selesai");
                            }}
                            disabled={updatingId === shipment.id}
                            className="px-6 py-2.5 bg-courier-primary hover:bg-green-800 text-white rounded-xl text-sm font-bold transition-colors shadow-md shadow-courier-primary/20"
                          >
                            Konfirmasi Sampai Tujuan
                          </button>
                        )}
                        {(shipment.status === "selesai" ||
                          shipment.status === "terkirim") && (
                          <span className="text-xs text-seller-semgreen font-bold flex items-center gap-1">
                            ✓ Pengiriman Selesai
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right Column: Map & GIS */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          <div className="bg-courier-surfacewhite border border-courier-hairline rounded-2xl overflow-hidden shadow-sm sticky top-24">
            <div className="p-4 flex justify-between items-center border-b border-courier-hairline bg-white">
              <h3 className="font-bold text-courier-textprimary text-sm">
                GIS Active Tracking
              </h3>
              <span className="bg-green-100 text-green-700 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider animate-pulse">
                LIVE
              </span>
            </div>

            {/* Real GIS Leaflet map div */}
            <div
              id="gis-map"
              className="h-80 w-full bg-[#EAE6E1]"
              style={{ zIndex: 1, minHeight: "320px" }}
            />

            {selectedShipment ? (
              <div className="p-5 space-y-4 bg-white">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-courier-textsecondary">
                    Rute ID
                  </span>
                  <span className="font-bold text-courier-textprimary">
                    #
                    {selectedShipment.order?.order_number ||
                      selectedShipment.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-courier-textsecondary">
                    Penerima
                  </span>
                  <span className="font-bold text-courier-textprimary">
                    {selectedShipment.order?.user?.name || "Mitra Pembeli"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-courier-textsecondary">
                    Status GPS
                  </span>
                  <span className="font-bold text-courier-primary">
                    Terhubung
                  </span>
                </div>
                <div className="h-1.5 bg-courier-warmbg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-courier-primary rounded-full transition-all duration-300"
                    style={{
                      width:
                        selectedShipment.status === "terkirim"
                          ? "100%"
                          : selectedShipment.status === "dalam_perjalanan"
                            ? "50%"
                            : "10%",
                    }}
                  ></div>
                </div>
              </div>
            ) : (
              <div className="p-5 text-center text-xs text-courier-textsecondary bg-white">
                Pilih pengiriman untuk melihat detail pelacakan rute.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Catatan & Konfirmasi Status */}
      {showNotesModal && pendingStatusUpdate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-courier-surfacewhite w-full max-w-sm rounded-3xl border border-courier-hairline overflow-hidden p-6 text-center space-y-4 animate-fade-in shadow-xl">
            <h3 className="text-lg font-bold text-courier-textprimary">
              {pendingStatusUpdate.status === "sedang_berjalan" ||
              pendingStatusUpdate.status === "dalam_perjalanan"
                ? "Mulai Pengantaran"
                : "Pengantaran Selesai"}
            </h3>
            <p className="text-xs text-courier-textsecondary leading-relaxed">
              Beri catatan pelacakan tambahan (misal: &quot;Barang sudah dimuat
              di pickup&quot; atau &quot;Diterima oleh Bpk. Ahmad di
              kebun&quot;).
            </p>
            <textarea
              value={trackingNotes}
              onChange={(e) => setTrackingNotes(e.target.value)}
              placeholder="Catatan tambahan (opsional)..."
              rows={3}
              className="w-full px-3.5 py-2.5 bg-courier-warmbg border border-courier-hairline rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-courier-primary resize-none text-courier-textprimary"
            />
            <div className="flex gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowNotesModal(false);
                  setPendingStatusUpdate(null);
                }}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() =>
                  handleUpdateStatus(
                    pendingStatusUpdate.id,
                    pendingStatusUpdate.status,
                    trackingNotes,
                  )
                }
                disabled={updatingId === pendingStatusUpdate.id}
                className="flex-1 px-4 py-2.5 bg-courier-primary hover:bg-green-800 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-courier-primary/20 disabled:opacity-50"
              >
                {updatingId === pendingStatusUpdate.id ? "Memproses..." : "Konfirmasi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
