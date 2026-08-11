"use client";

import React, { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/admin/Toast";

function CustomTimeframeDropdown({
  value,
  onChange,
  colorScheme = "admin",
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

interface CategoryDist {
  category_name: string;
  total: string | number;
}

interface RegionalDist {
  provinsi: string;
  total: string | number;
}

interface AnalyticsData {
  total_waste_managed_kg: number;
  total_co2eq_reduced_kg: number;
  active_sellers_count: number;
  category_distribution: CategoryDist[];
  regional_distribution: RegionalDist[];
}

export default function AdminAnalytics() {
  const { showToast } = useToast();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "1m" | "1y">("7d");

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/admin/analytics");
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      } else {
        showToast("Gagal mengambil data analitik.", "error");
      }
    } catch {
      showToast("Terjadi kesalahan koneksi saat memuat analitik.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const totalWasteTons = data ? data.total_waste_managed_kg / 1000 : 0;
  const totalCo2 = data ? data.total_co2eq_reduced_kg : 0;
  const activeSellers = data ? data.active_sellers_count : 0;

  const sdg12Target = 640; // 640 tons SDG 12 annual target
  const sdg12Pct = Math.min(
    Math.round((totalWasteTons / sdg12Target) * 100),
    100,
  );
  const sdg12DashOffset = 251.2 * (1 - sdg12Pct / 100);

  // methane reduction estimate: CO2 saved × 0.036 m³
  const methaneReduced = Math.round(totalCo2 * 0.036);
  const sdg13Target = 28000; // 28,000 m³ SDG 13 annual target
  const sdg13Pct = Math.min(
    Math.round((methaneReduced / sdg13Target) * 100),
    100,
  );
  const sdg13DashOffset = 251.2 * (1 - sdg13Pct / 100);

  const getCategoryLabel = (slug: string) => {
    switch (slug) {
      case "kotoran_padat":
        return "Limbah Padat";
      case "limbah_cair":
        return "Limbah Cair";
      case "limbah_olahan":
        return "Limbah Olahan";
      default:
        return slug.replace("_", " ");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-admin-textprimary mb-1">
            Analitik Dampak Lingkungan
          </h2>
          <p className="text-sm text-admin-textsecondary">
            Pemantauan pengurangan limbah tani dan mitigasi karbon secara
            real-time.
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 text-sm font-bold text-admin-primary bg-admin-surfacewhite border border-admin-hairline rounded-xl hover:bg-admin-warmbg flex items-center gap-2 transition-colors shadow-sm self-start"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18v3z"
            />
          </svg>
          Segarkan Data
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-admin-surfacewhite border border-admin-hairline rounded-2xl p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-admin-semgreen/10 text-admin-semgreen rounded-xl flex items-center justify-center">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            </div>
          </div>
          <span className="text-[10px] font-bold text-admin-textsecondary tracking-wider uppercase block mb-1">
            TOTAL LIMBAH TERALIHKAN
          </span>
          <div className="text-2xl font-bold font-tabular text-admin-textprimary tracking-tight mb-1">
            {loading
              ? "..."
              : totalWasteTons.toLocaleString("id-ID", {
                  maximumFractionDigits: 1,
                })}{" "}
            <span className="text-lg font-medium">Ton</span>
          </div>
          <p className="text-xs text-admin-textsecondary">
            Kumulatif Transaksi Selesai
          </p>
        </div>

        <div className="bg-admin-surfacewhite border border-admin-hairline rounded-2xl p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-admin-primary-light text-admin-primary rounded-xl flex items-center justify-center font-bold text-xs tracking-tighter">
              CO₂e
            </div>
          </div>
          <span className="text-[10px] font-bold text-admin-textsecondary tracking-wider uppercase block mb-1">
            REDUKSI EMISI METANA (CO₂e)
          </span>
          <div className="text-2xl font-bold font-tabular text-admin-textprimary tracking-tight mb-1">
            {loading
              ? "..."
              : totalCo2.toLocaleString("id-ID", {
                  maximumFractionDigits: 1,
                })}{" "}
            <span className="text-lg font-medium">kgCO₂e</span>
          </div>
          <p className="text-xs text-admin-textsecondary">
            Reduksi Emisi Metana & Gas Rumah Kaca
          </p>
        </div>

        <div className="bg-admin-surfacewhite border border-admin-hairline rounded-2xl p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-admin-semamber/10 text-admin-semamber rounded-xl flex items-center justify-center">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>
          <span className="text-[10px] font-bold text-admin-textsecondary tracking-wider uppercase block mb-1">
            PRODUSEN AKTIF
          </span>
          <div className="text-2xl font-bold font-tabular text-admin-textprimary tracking-tight mb-1">
            {loading ? "..." : activeSellers}{" "}
            <span className="text-lg font-medium">Peternak</span>
          </div>
          <p className="text-xs text-admin-textsecondary">
            Jaringan Aktif Platform
          </p>
        </div>
      </div>

      {/* Chart + Regional */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Category Bar Chart */}
        <div className="bg-admin-surfacewhite border border-admin-hairline rounded-2xl p-6 lg:w-3/5 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-lg font-bold text-admin-textprimary">
                Distribusi Limbah berdasarkan Kategori
              </h3>
              <p className="text-xs text-admin-textsecondary mt-0.5">
                Perbandingan volume total limbah tani yang terkelola berdasarkan
                kategorinya.
              </p>
            </div>
            <CustomTimeframeDropdown
              value={timeRange}
              onChange={setTimeRange}
              colorScheme="admin"
            />
          </div>

          {/* Full Height Chart Container */}
          <div className="flex-1 flex flex-col justify-between mt-2 relative h-[240px]">
            {/* Grid & Chart Overlay Area */}
            <div className="relative flex-1 w-full flex h-[200px]">
              {/* Dedicated Left Y-Axis Labels */}
              <div className="w-10 flex flex-col justify-between text-[10px] font-bold text-admin-textsecondary font-tabular pb-6 select-none border-r border-admin-hairline/40 pr-2">
                <span>100%</span>
                <span>75%</span>
                <span>50%</span>
                <span>25%</span>
                <span>0%</span>
              </div>

              {/* Grid Lines + Bar Chart Canvas */}
              <div className="relative flex-1 h-full pl-3 pr-2">
                {/* Horizontal Dashed Grid Lines */}
                <div className="absolute inset-x-0 inset-y-0 flex flex-col justify-between pointer-events-none pb-6">
                  <div className="border-b border-dashed border-admin-hairline/60 w-full" />
                  <div className="border-b border-dashed border-admin-hairline/60 w-full" />
                  <div className="border-b border-dashed border-admin-hairline/60 w-full" />
                  <div className="border-b border-dashed border-admin-hairline/60 w-full" />
                  <div className="border-b border-admin-hairline/80 w-full" />
                </div>

                {/* Vertical Bar Pillars */}
                <div className="relative h-full flex items-end justify-around pb-6 pt-2 z-10">
                  {loading ? (
                    <div className="text-xs text-admin-textsecondary italic py-10">
                      Memuat grafik...
                    </div>
                  ) : !data || data.category_distribution.length === 0 ? (
                    <div className="text-xs text-admin-textsecondary italic py-10">
                      Belum ada transaksi limbah selesai.
                    </div>
                  ) : (
                    data.category_distribution.map((cat) => {
                      const totalCatVal = Number(cat.total);
                      const maxVal = Math.max(
                        ...data.category_distribution.map((c) =>
                          Number(c.total),
                        ),
                        1,
                      );
                      const heightPercent = Math.max(
                        (totalCatVal / maxVal) * 100,
                        10,
                      );
                      const color =
                        cat.category_name === "limbah_cair" || cat.category_name === "limbah-cair"
                          ? "bg-blue-500 hover:bg-blue-600"
                          : cat.category_name === "limbah_olahan" || cat.category_name === "limbah-olahan"
                          ? "bg-amber-500 hover:bg-amber-600"
                          : "bg-admin-primary hover:bg-[#009A44]";

                      return (
                        <div
                          key={cat.category_name}
                          className="flex flex-col items-center w-[25%] h-full justify-end"
                        >
                          {/* Bar Pillar with Hover Tooltip */}
                          <div
                            className={`w-full max-w-[36px] ${color} rounded-t-lg transition-all duration-300 shadow-md group/bar relative cursor-pointer`}
                            style={{ height: `${heightPercent}%` }}
                          >
                            {/* Hover Tooltip Badge */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#1E293B] text-white text-[10px] px-2.5 py-1 rounded-lg opacity-0 pointer-events-none group-hover/bar:opacity-100 group-hover/bar:-translate-y-1 transition-all duration-200 whitespace-nowrap font-bold shadow-xl z-30">
                              {totalCatVal.toLocaleString("id-ID")} kg
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1E293B]" />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* X-Axis Category Labels */}
            {data && data.category_distribution.length > 0 && (
              <div className="pl-12 flex justify-around text-[10px] font-bold text-admin-textsecondary pt-2 uppercase tracking-wider border-t border-admin-hairline">
                {data.category_distribution.map((cat) => (
                  <span
                    key={cat.category_name}
                    className="truncate text-center w-[25%]"
                  >
                    {getCategoryLabel(cat.category_name)}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-4 text-xs font-bold">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-admin-primary" />
              <span className="text-admin-textsecondary">
                Kotoran Padat
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-admin-textsecondary">Limbah Cair</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-admin-textsecondary">Limbah Olahan</span>
            </div>
          </div>
        </div>

        {/* Regional Growth */}
        <div className="bg-admin-surfacewhite border border-admin-hairline rounded-2xl p-6 lg:w-2/5 flex flex-col justify-between">
          <h3 className="text-lg font-bold text-admin-textprimary mb-6">
            Pertumbuhan Regional
          </h3>

          <div className="space-y-5 flex-1">
            {loading ? (
              <div className="text-xs text-admin-textsecondary italic">
                Memuat data wilayah...
              </div>
            ) : !data || data.regional_distribution.length === 0 ? (
              <div className="text-xs text-admin-textsecondary italic">
                Belum ada penyebaran wilayah transaksi.
              </div>
            ) : (
              data.regional_distribution.map((reg) => {
                const regTotal = Number(reg.total);
                const totalAll = data.regional_distribution.reduce(
                  (acc, curr) => acc + Number(curr.total),
                  0,
                );
                const pct = totalAll > 0 ? (regTotal / totalAll) * 100 : 0;

                return (
                  <div key={reg.provinsi}>
                    <div className="flex justify-between text-[10px] font-bold mb-1.5">
                      <span className="text-admin-textsecondary">
                        {reg.provinsi}
                      </span>
                      <span className="text-admin-textprimary font-tabular">
                        {regTotal.toLocaleString("id-ID")} kg ({pct.toFixed(1)}
                        %)
                      </span>
                    </div>
                    <div className="w-full bg-admin-warmbg h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-admin-semgreen h-full rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-6 p-5 bg-admin-primary-light border border-admin-primary/20 rounded-xl flex gap-3 items-start">
            <svg
              className="w-5 h-5 text-admin-primary shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-xs text-admin-textsecondary leading-relaxed">
              <span className="font-bold text-admin-primary block mb-1">
                Wawasan Wilayah
              </span>
              Pencegahan karbon dan kontribusi limbah terbanyak dikontribusikan
              dari wilayah Jawa Timur dan Jawa Barat.
            </p>
          </div>
        </div>
      </div>

      <div className="text-center text-[10px] font-bold text-admin-textsecondary tracking-wider pt-4">
        AgroWaste Impact Analytics Engine v4.2.0 — Diperbarui secara dinamis
        dari basis data
      </div>
    </div>
  );
}
