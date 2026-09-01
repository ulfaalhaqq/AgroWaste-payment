"use client";

import React, { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getUser } from "@/lib/auth";
import Link from "next/link";

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
    user?: {
      name: string;
    };
    peternak?: {
      name: string;
      peternak_profile?: {
        nama_peternakan: string;
        lat: string | number | null;
        lng: string | number | null;
      };
    };
    order_items?: Array<{
      id: string;
      product?: {
        name: string;
      };
    }>;
  };
}

function formatDate(d: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(d));
}

export default function CourierDashboard() {
  const [courierName, setCourierName] = useState("Kurir");
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayStr, setTodayStr] = useState("");

  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);

  useEffect(() => {
    setCourierName(getUser()?.name || "Kurir");
    setTodayStr(
      new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date()),
    );

    apiFetch("/logistik/shipments")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.success && json?.data) {
          setShipments((json.data as Shipment[]) || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
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

  // draw active/scheduled routes on overview map
  useEffect(() => {
    if (!leafletLoaded) return;
    const L = window.L;
    if (!L) return;

    const activeShipments = shipments.filter(
      (s) => s.status === "dalam_perjalanan" || s.status === "dijadwalkan",
    );

    let map = mapInstance;
    if (!map) {
      map = L.map("overview-map").setView([-7.9666, 112.6326], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);
      setMapInstance(map);
    } else {
      // clear stale layers before redrawing
      const currentMap = map;
      currentMap.eachLayer((layer: LeafletLayer) => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
          currentMap.removeLayer(layer);
        }
      });
    }

    const boundsPoints: [number, number][] = [];

    activeShipments.forEach((shipment, index) => {
      let pLat = -6.5971 + index * 0.01; // distribute fallbacks a bit
      let pLng = 106.7973 - index * 0.01;
      const peternak = shipment.order?.peternak?.peternak_profile;
      if (peternak?.lat && peternak?.lng) {
        pLat = Number(peternak.lat);
        pLng = Number(peternak.lng);
      }

      const dLat = pLat + 0.015;
      const dLng = pLng + 0.025;

      boundsPoints.push([pLat, pLng]);
      boundsPoints.push([dLat, dLng]);

      const isTransit = shipment.status === "dalam_perjalanan";

      L.marker([pLat, pLng])
        .addTo(map)
        .bindPopup(
          `<b>Pickup #${index + 1}:</b> ${peternak?.nama_peternakan || "Peternak"}`,
        );

      L.marker([dLat, dLng])
        .addTo(map)
        .bindPopup(
          `<b>Kirim #${index + 1}:</b> ${shipment.order?.user?.name || "Pembeli"}`,
        );

      L.polyline(
        [
          [pLat, pLng],
          [dLat, dLng],
        ],
        {
          color: isTransit ? "#FF8A00" : "#2F5A28",
          weight: 3,
          opacity: 0.7,
        },
      ).addTo(map);
    });

    if (boundsPoints.length > 0) {
      map.fitBounds(L.latLngBounds(boundsPoints), { padding: [30, 30] });
    }
  }, [leafletLoaded, shipments, mapInstance]);

  const totalCount = shipments.length;
  const successCount = shipments.filter(
    (s) => s.status === "terkirim" || s.status === "selesai",
  ).length;
  const activeRoutesCount = shipments.filter(
    (s) => s.status === "dalam_perjalanan" || s.status === "sedang_berjalan",
  ).length;
  const scheduledCount = shipments.filter(
    (s) => s.status === "dijadwalkan",
  ).length;

  const todayTasks = shipments.filter(
    (s) => s.status !== "terkirim" && s.status !== "selesai",
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20 relative">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-courier-primary mb-1">
            Halo, {courierName}!
          </h2>
          <p className="text-sm text-courier-textsecondary">
            Siap untuk pengiriman pupuk AgroWaste hari ini?
          </p>
        </div>
        <div className="px-4 py-2 bg-courier-warmbg border border-courier-hairline rounded-lg text-sm font-bold text-courier-textprimary flex items-center gap-2 shadow-sm self-start sm:self-auto">
          <svg
            className="w-4 h-4 text-courier-primary"
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
          {todayStr}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-courier-surfacewhite border border-courier-hairline rounded-xl sm:rounded-2xl p-4 sm:p-6 relative flex flex-col justify-between hover:border-courier-primary/50 transition-colors shadow-sm">
          <div className="flex justify-between items-start mb-2 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-courier-warmbg text-courier-textsecondary flex items-center justify-center">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
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
          </div>
          <div>
            <span className="text-[10px] sm:text-xs text-courier-textsecondary block mb-1">
              Total Pengiriman Saya
            </span>
            <div className="text-2xl sm:text-4xl font-bold font-tabular text-courier-textprimary">
              {loading ? "..." : totalCount}
            </div>
          </div>
        </div>

        <div className="bg-courier-surfacewhite border border-courier-hairline rounded-xl sm:rounded-2xl p-4 sm:p-6 relative flex flex-col justify-between hover:border-courier-primary/50 transition-colors shadow-sm">
          <div className="flex justify-between items-start mb-2 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-courier-primary/10 text-courier-primary flex items-center justify-center">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <div>
            <span className="text-[10px] sm:text-xs text-courier-textsecondary block mb-1">
              Pengiriman Berhasil
            </span>
            <div className="text-2xl sm:text-4xl font-bold font-tabular text-courier-textprimary">
              {loading ? "..." : `${successCount} Selesai`}
            </div>
          </div>
        </div>

        <div className="bg-courier-surfacewhite border border-courier-hairline rounded-xl sm:rounded-2xl p-4 sm:p-6 relative flex flex-col justify-between hover:border-courier-primary/50 transition-colors shadow-sm">
          <div className="flex justify-between items-start mb-2 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-courier-warmbg text-courier-textsecondary flex items-center justify-center">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            </div>
          </div>
          <div>
            <span className="text-[10px] sm:text-xs text-courier-textsecondary block mb-1">
              Rute Aktif & Terjadwal
            </span>
            <div className="text-2xl sm:text-4xl font-bold font-tabular text-courier-textprimary">
              {loading
                ? "..."
                : `${activeRoutesCount} Aktif / ${scheduledCount} Antrean`}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tugas Hari Ini */}
        <div>
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-xl font-bold text-courier-textprimary">
              Tugas Pengantaran Aktif
            </h3>
            <Link
              href="/courier/shipments"
              className="text-xs font-bold text-courier-primary hover:underline"
            >
              Buka Manajemen Pengiriman →
            </Link>
          </div>
          <div className="space-y-4">
            {loading && (
              <div className="p-8 text-center text-xs text-courier-textsecondary animate-pulse">
                Memuat daftar tugas...
              </div>
            )}
            {!loading && todayTasks.length === 0 && (
              <div className="p-8 border border-dashed border-courier-hairline rounded-2xl text-center text-xs text-courier-textsecondary bg-white">
                Hari ini tidak ada tugas pengiriman aktif yang tertunda.
              </div>
            )}
            {!loading &&
              todayTasks.map((task, index) => {
                const orderNo =
                  task.order?.order_number || task.id.slice(0, 8).toUpperCase();
                const peternak = task.order?.peternak?.peternak_profile;
                const productTitle =
                  task.order?.order_items?.[0]?.product?.name ||
                  "Limbah Organik AgroWaste";
                const isTransit = task.status === "dalam_perjalanan";

                return (
                  <Link
                    key={task.id}
                    href={`/courier/shipments`}
                    className="bg-courier-surfacewhite border border-courier-hairline p-5 rounded-2xl flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer block"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 ${isTransit ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-700"} rounded-xl flex items-center justify-center shrink-0`}
                      >
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
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                          />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-courier-textprimary text-sm">
                          #{orderNo} — {productTitle}
                        </h4>
                        <p className="text-xs font-medium text-courier-textsecondary mt-0.5">
                          Jemput:{" "}
                          <span className="text-courier-primary font-bold">
                            {peternak?.nama_peternakan || "Peternak"}
                          </span>{" "}
                          • Kirim ke:{" "}
                          <span className="font-semibold text-courier-textprimary">
                            {task.order?.user?.name || "Pembeli"}
                          </span>
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                        isTransit
                          ? "bg-orange-100 text-orange-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {isTransit ? "Dalam Perjalanan" : "Dijadwalkan"}
                    </span>
                  </Link>
                );
              })}
          </div>
        </div>

        {/* Visual Rute */}
        <div className="flex flex-col">
          <h3 className="text-xl font-bold text-courier-textprimary mb-4">
            Peta Rute Aktif
          </h3>
          <div className="bg-courier-surfacewhite border border-courier-hairline rounded-2xl overflow-hidden shadow-sm flex flex-col flex-1">
            {/* GIS Overview map */}
            <div
              id="overview-map"
              className="h-64 bg-gray-100 w-full"
              style={{ zIndex: 1, minHeight: "256px" }}
            />

            <div className="p-5 flex justify-between items-center bg-courier-surfacewhite text-sm border-t border-courier-hairline">
              <div>
                <span className="text-[10px] font-bold text-courier-textsecondary uppercase tracking-wider block mb-1">
                  RUTE AKTIF
                </span>
                <span className="font-bold text-courier-textprimary font-tabular">
                  {activeRoutesCount} Rute Sedang Berjalan
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-courier-textsecondary uppercase tracking-wider block mb-1">
                  RUTE ANTRIAN
                </span>
                <span className="font-bold text-courier-textprimary font-tabular">
                  {scheduledCount} Menunggu Konfirmasi
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <Link
        href="/courier/shipments"
        className="fixed bottom-8 right-8 w-14 h-14 bg-courier-primary text-white rounded-2xl shadow-xl shadow-courier-primary/30 flex items-center justify-center hover:-translate-y-1 transition-transform z-30"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </Link>
    </div>
  );
}
