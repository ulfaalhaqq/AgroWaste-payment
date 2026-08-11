"use client";

import React from "react";
import { useParams } from "next/navigation";

export default function OrderDetails() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-admin-textprimary">
            Order {id}
          </h2>
          <p className="text-sm text-admin-textsecondary mt-1">
            Order dibuat pada 24 Mei 2026 • 10:42 WIB
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-admin-semamber/10 text-admin-semamber font-semibold rounded-xl text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-admin-semamber animate-pulse"></span>
            Sedang Dikirim
          </div>
        </div>
      </div>

      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Items & Stakeholders */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-admin-surfacewhite border border-admin-hairline rounded-2xl p-6">
            <h3 className="text-[10px] font-bold text-admin-textsecondary tracking-wider uppercase mb-4">
              Item Transaksi
            </h3>
            <div className="bg-admin-warmbg rounded-xl p-4 flex gap-4 border border-admin-hairline mb-6">
              <img
                src="https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&w=150&q=80"
                alt="Produk"
                className="w-16 h-16 rounded-lg object-cover border border-admin-hairline"
              />
              <div>
                <h4 className="font-bold text-admin-textprimary text-base leading-tight">
                  Pupuk Kandang Sapi Organik
                </h4>
                <p className="text-sm text-admin-textsecondary mt-1">
                  Kualitas Premium
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-admin-textsecondary font-medium">
                  Jumlah
                </span>
                <span className="font-bold text-admin-textprimary font-tabular">
                  500 kg
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-admin-textsecondary font-medium">
                  Harga Satuan
                </span>
                <span className="font-bold text-admin-textprimary font-tabular">
                  Rp 2.595{" "}
                  <span className="text-xs font-normal text-admin-textsecondary">
                    / kg
                  </span>
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-admin-hairline flex justify-between items-end">
              <span className="font-bold text-admin-textprimary text-base">
                Total Pembayaran
              </span>
              <span className="text-2xl font-bold text-admin-semgreen font-tabular">
                Rp 1.297.500
              </span>
            </div>
          </div>

          <div className="bg-admin-surfacewhite border border-admin-hairline rounded-2xl p-6">
            <h3 className="text-[10px] font-bold text-admin-textsecondary tracking-wider uppercase mb-4">
              Pihak Terkait
            </h3>
            <div className="space-y-4">
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 rounded-full bg-admin-semgreen/10 text-admin-semgreen flex items-center justify-center font-bold border border-admin-semgreen/20 shrink-0 text-sm">
                  PS
                </div>
                <div>
                  <div className="text-[10px] font-bold text-admin-textsecondary uppercase tracking-wider mb-0.5">
                    PETERNAK (PENJUAL)
                  </div>
                  <div className="font-semibold text-admin-textprimary text-sm">
                    Pak Slamet
                  </div>
                  <div className="text-xs text-admin-textsecondary mt-0.5">
                    Sukamulya Farm, Bogor
                  </div>
                </div>
              </div>
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100 shrink-0 text-sm">
                  PB
                </div>
                <div>
                  <div className="text-[10px] font-bold text-admin-textsecondary uppercase tracking-wider mb-0.5">
                    PEMBELI
                  </div>
                  <div className="font-semibold text-admin-textprimary text-sm">
                    Pak Budiman
                  </div>
                  <div className="text-xs text-admin-textsecondary mt-0.5">
                    Taman Hijau Nursery, Jakarta
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE: GIS Tracking */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-admin-surfacewhite border border-admin-hairline rounded-2xl p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] font-bold text-admin-textsecondary tracking-wider uppercase">
                Pelacakan GIS Langsung
              </h3>
              <span className="text-xs font-bold text-admin-semgreen flex items-center gap-1.5 bg-admin-semgreen/10 px-2 py-1 rounded-lg">
                <span className="w-1.5 h-1.5 bg-admin-semgreen rounded-full animate-pulse"></span>
                Sinyal GPS Aktif
              </span>
            </div>

            {/* Map */}
            <div
              className="w-full rounded-xl overflow-hidden relative bg-[#1E1E1E]"
              style={{ minHeight: "400px" }}
            >
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                src="https://www.openstreetmap.org/export/embed.html?bbox=106.83%2C-6.50%2C106.87%2C-6.46&amp;layer=mapnik"
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{
                  filter:
                    "grayscale(100%) invert(100%) contrast(120%) brightness(70%)",
                }}
              />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 flex items-center justify-center pointer-events-none">
                <span className="absolute inline-flex h-full w-full rounded-full border-2 border-admin-semamber opacity-20 animate-radar"></span>
                <span
                  className="absolute inline-flex h-3/4 w-3/4 rounded-full border border-admin-semamber opacity-20 animate-radar"
                  style={{ animationDelay: "0.5s" }}
                ></span>
                <span
                  className="absolute inline-flex h-1/2 w-1/2 rounded-full bg-admin-semamber opacity-10 animate-radar"
                  style={{ animationDelay: "1s" }}
                ></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-admin-semamber shadow-[0_0_20px_4px_rgba(245,158,11,0.8)]"></span>
              </div>
              <div className="absolute top-[30%] left-[35%] w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-md">
                <div className="w-1.5 h-1.5 bg-admin-semgreen rounded-full"></div>
              </div>
              <div className="absolute top-[25%] left-[65%] w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-md">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
              </div>
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <path
                  d="M35 30 Q 40 50 50 50 T 65 25"
                  fill="none"
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="0.5"
                  strokeDasharray="1 1"
                />
              </svg>
              <div className="absolute bottom-4 left-4 right-4 bg-admin-surfacewhite/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-admin-hairline">
                <div className="text-[10px] font-bold text-admin-textsecondary uppercase tracking-wider mb-1">
                  LOKASI SAAT INI
                </div>
                <div className="font-semibold text-admin-textprimary text-sm">
                  Jl. Raya Bogor KM 42, Cibinong
                </div>
              </div>
            </div>

            {/* Courier footer */}
            <div className="mt-4 pt-4 border-t border-admin-hairline flex items-center justify-between">
              <div className="flex gap-3 items-center">
                <img
                  src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=100&q=80"
                  alt="Kurir"
                  className="w-12 h-12 rounded-xl object-cover border border-admin-hairline"
                />
                <div>
                  <div className="text-[10px] font-bold text-admin-textsecondary uppercase tracking-wider mb-0.5">
                    KURIR DITUGASKAN
                  </div>
                  <div className="font-semibold text-admin-textprimary text-sm">
                    Pak Agus Subagio
                  </div>
                  <div className="text-xs text-admin-textsecondary mt-0.5 font-tabular">
                    ID Mitra: LGW-882
                  </div>
                </div>
              </div>
              {/* Phone/Message icons hidden */}
            </div>
          </div>
        </div>

        {/* RIGHT: Timeline */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-admin-surfacewhite border border-admin-hairline rounded-2xl p-6 h-full flex flex-col">
            <h3 className="text-base font-bold text-admin-textprimary mb-6">
              Riwayat Aktivitas
            </h3>

            <div className="flex-1 relative">
              <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-admin-hairline"></div>
              <div className="space-y-8 relative">
                <div className="relative pl-6">
                  <span className="absolute left-0 w-3.5 h-3.5 rounded-full bg-admin-semamber ring-4 ring-admin-semamber/10 top-1"></span>
                  <div className="font-bold text-admin-textprimary text-sm">
                    Sedang Dikirim
                  </div>
                  <div className="text-xs text-admin-textsecondary font-tabular mt-0.5 mb-2">
                    Hari ini, 14:15 WIB
                  </div>
                  <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded-lg border border-amber-100 leading-relaxed">
                    Keluar untuk pengiriman dari Hub Cimanggis
                  </div>
                </div>

                <div className="relative pl-6">
                  <span className="absolute left-0 w-3.5 h-3.5 rounded-full bg-admin-semgreen ring-4 ring-admin-semgreen/10 top-1"></span>
                  <div className="font-bold text-admin-textprimary text-sm">
                    Ditugaskan ke Kurir
                  </div>
                  <div className="text-xs text-admin-textsecondary font-tabular mt-0.5 mb-2">
                    Hari ini, 11:30 WIB
                  </div>
                  <div className="text-xs text-admin-textsecondary leading-relaxed">
                    Kendaraan: Isuzu Traga [B 9122 ABC]
                  </div>
                </div>

                <div className="relative pl-6">
                  <span className="absolute left-0 w-3.5 h-3.5 rounded-full bg-admin-semgreen ring-4 ring-admin-semgreen/10 top-1"></span>
                  <div className="font-bold text-admin-textprimary text-sm">
                    Dikonfirmasi Penjual
                  </div>
                  <div className="text-xs text-admin-textsecondary font-tabular mt-0.5 mb-2">
                    24 Mei, 14:45 WIB
                  </div>
                  <div className="text-xs text-admin-textsecondary leading-relaxed">
                    Pak Slamet siap untuk penjemputan
                  </div>
                </div>

                <div className="relative pl-6">
                  <span className="absolute left-0 w-3.5 h-3.5 rounded-full bg-admin-semgreen ring-4 ring-admin-semgreen/10 top-1"></span>
                  <div className="font-bold text-admin-textprimary text-sm">
                    Pembayaran Dikonfirmasi
                  </div>
                  <div className="text-xs text-admin-textsecondary font-tabular mt-0.5 mb-2">
                    24 Mei, 11:15 WIB
                  </div>
                  <div className="text-xs text-admin-textsecondary leading-relaxed">
                    Transaksi dikonfirmasi via Transfer Bank
                  </div>
                </div>

                <div className="relative pl-6">
                  <span className="absolute left-0 w-3.5 h-3.5 rounded-full bg-admin-semgreen ring-4 ring-admin-semgreen/10 top-1"></span>
                  <div className="font-bold text-admin-textprimary text-sm">
                    Order Dibuat
                  </div>
                  <div className="text-xs text-admin-textsecondary font-tabular mt-0.5">
                    24 Mei, 10:42 WIB
                  </div>
                </div>
              </div>
            </div>

            {/* Tambah Catatan Admin hidden */}
          </div>
        </div>
      </div>
    </div>
  );
}
