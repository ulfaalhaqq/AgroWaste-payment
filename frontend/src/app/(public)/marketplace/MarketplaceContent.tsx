"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Navigation,
  CheckCircle2,
} from "lucide-react";
import MarketplaceProducts from "./MarketplaceProducts";
import { requestUserLocation } from "@/lib/location";

const KATEGORI_OPTIONS = [
  { value: "kotoran_padat", label: "Kotoran Padat" },
  { value: "limbah_cair", label: "Limbah Cair" },
  { value: "limbah_olahan", label: "Limbah Olahan" },
];

const PROVINSI_OPTIONS = [
  "Jawa Timur",
  "Jawa Tengah",
  "Jawa Barat",
  "Luar Pulau Jawa",
];

// Nilai dikirim lowercase persis ke ?jenis_ternak=
const JENIS_TERNAK_OPTIONS = [
  { label: "Sapi", value: "sapi" },
  { label: "Kambing", value: "kambing" },
  { label: "Ayam", value: "ayam" },
];

export default function MarketplaceContent() {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce 400ms — tidak spam request saat setiap ketukan
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(id);
  }, [searchInput]);

  const [jenisTernak, setJenisTernak] = useState("");
  const [kategori, setKategori] = useState("");
  const [provinsi, setProvinsi] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // State Lokasi Pengguna
  const [userCoords, setUserCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  const handleRequestLocation = async () => {
    setLocLoading(true);
    setLocError(null);
    try {
      const coords = await requestUserLocation();
      setUserCoords(coords);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Gagal memperoleh izin lokasi.";
      setLocError(message);
    } finally {
      setLocLoading(false);
    }
  };

  // filterParams dikirim ke MarketplaceProducts; berubah → langsung re-fetch
  const filterParams = useMemo(() => {
    const parts: string[] = [];
    if (debouncedSearch)
      parts.push(`search=${encodeURIComponent(debouncedSearch)}`);
    if (jenisTernak)
      parts.push(`jenis_ternak=${encodeURIComponent(jenisTernak)}`);
    if (kategori) parts.push(`kategori=${encodeURIComponent(kategori)}`);
    if (provinsi) parts.push(`provinsi=${encodeURIComponent(provinsi)}`);
    return parts.join("&");
  }, [debouncedSearch, jenisTernak, kategori, provinsi]);

  const hasActiveFilter = !!(
    debouncedSearch ||
    jenisTernak ||
    kategori ||
    provinsi
  );

  const handleReset = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setJenisTernak("");
    setKategori("");
    setProvinsi("");
  };

  return (
    <div className="flex-1 animate-fade-in pb-20">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
        {/* ── Hero Section & Searchbar ── */}
        <section className="bg-land-ink rounded-[32px] px-6 py-10 md:py-12 mt-6 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-md">
          <div className="absolute top-0 left-0 w-64 h-64 bg-land-accent rounded-full mix-blend-screen filter blur-[100px] opacity-20 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-land-clay rounded-full mix-blend-screen filter blur-[100px] opacity-10 pointer-events-none" />

          <h1
            className="text-3xl md:text-4xl font-land-heading font-bold text-white mb-8 relative z-10"
            style={{ textWrap: "balance" }}
          >
            Bursa pupuk organik{" "}
            <span className="text-emerald-300">terbesar.</span>
          </h1>

          <div className="w-full max-w-3xl relative z-20 group">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && setDebouncedSearch(searchInput.trim())
              }
              placeholder="Cari kompos atau pupuk kandang..."
              className="w-full h-16 md:h-20 pl-11 sm:pl-14 md:pl-16 pr-24 sm:pr-32 md:pr-40 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/60 text-sm sm:text-base md:text-xl focus:outline-none focus:bg-white/20 focus:border-land-accent transition-all shadow-[0_8px_32px_rgba(0,0,0,0.15)]"
            />
            <Search className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white/60 absolute left-4 sm:left-5 md:left-6 top-1/2 -translate-y-1/2 group-focus-within:text-land-accent transition-colors pointer-events-none" />

            <button
              type="button"
              onClick={() => setDebouncedSearch(searchInput.trim())}
              className="absolute right-2 top-2 bottom-2 px-4 sm:px-6 md:px-10 bg-land-accent hover:bg-land-accent-hover text-white rounded-full font-bold text-xs sm:text-sm md:text-lg transition-transform hover:scale-105 shadow-md flex items-center justify-center cursor-pointer"
            >
              Cari
            </button>
          </div>
        </section>

        {/* ── Location Widget Bar ── */}
        <div className="mt-6 bg-white border border-[#E8E0D5] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-land-accent/10 text-land-accent flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-land-muted">
                  Lokasi Pembeli
                </span>
                {userCoords && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> GPS Terhubung
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-land-ink mt-0.5">
                {userCoords
                  ? `Koordinat: ${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)}`
                  : "Aktifkan lokasi untuk rekomendasi pupuk terdekat"}
              </p>
              {locError && (
                <p className="text-xs text-red-500 font-semibold mt-1">
                  {locError}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleRequestLocation}
            disabled={locLoading}
            className="w-full sm:w-auto px-5 py-2.5 bg-land-accent hover:bg-land-accent-hover text-white rounded-full text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <Navigation
              className={`w-3.5 h-3.5 ${locLoading ? "animate-spin" : ""}`}
            />
            {locLoading
              ? "Mendeteksi..."
              : userCoords
                ? "Perbarui Lokasi"
                : "Gunakan Lokasi Saya"}
          </button>
        </div>

        {/* ── Sidebar + Grid ── */}
        <div className="lg:hidden mt-6 flex justify-between items-center gap-4">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex-1 py-3.5 bg-white border border-[#E8E0D5] rounded-full text-sm font-bold text-land-ink hover:border-land-accent transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {showFilters ? "Sembunyikan Filter" : "Tampilkan Filter"}
          </button>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-3.5 bg-land-clay/10 text-land-clay font-bold rounded-full text-sm hover:bg-land-clay/20 transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8 mt-6 lg:mt-12">
          {/* Left Sidebar */}
          <div
            className={`w-full lg:w-1/4 shrink-0 ${showFilters ? "block" : "hidden lg:block"} flex flex-col gap-4 lg:gap-6`}
          >
            <div className="bg-white border border-[#E8E0D5] rounded-2xl lg:rounded-[32px] p-4 lg:p-8 shadow-[0_8px_24px_rgba(44,57,48,0.04)] sticky top-24">
              {/* Header */}
              <div className="hidden lg:flex items-center justify-between mb-6 pb-6 border-b border-[#E8E0D5]">
                <div className="flex items-center gap-3">
                  <SlidersHorizontal className="w-5 h-5 text-land-ink" />
                  <h2 className="font-land-heading font-bold text-xl text-land-ink">
                    Filter
                  </h2>
                </div>
                {hasActiveFilter && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-[10px] font-bold text-land-clay hover:opacity-70 uppercase tracking-wider transition-opacity"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Jenis Ternak */}
              <div className="mb-5 lg:mb-8">
                <h3 className="font-bold text-xs lg:text-sm text-land-ink mb-3 lg:mb-4 uppercase tracking-wider">
                  Jenis Ternak
                </h3>
                <div className="space-y-3 lg:space-y-4">
                  {JENIS_TERNAK_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2.5 lg:gap-3 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={jenisTernak === opt.value}
                        onChange={() =>
                          setJenisTernak((prev) =>
                            prev === opt.value ? "" : opt.value,
                          )
                        }
                        className="w-4 h-4 lg:w-5 lg:h-5 rounded-[4px] lg:rounded-[6px] border-[#E8E0D5] text-land-accent focus:ring-land-accent transition-colors cursor-pointer"
                      />
                      <span
                        className={`text-sm lg:text-base font-medium transition-colors group-hover:text-land-ink ${
                          jenisTernak === opt.value
                            ? "text-land-accent font-semibold"
                            : "text-land-muted"
                        }`}
                      >
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Kategori */}
              <div className="mb-5 lg:mb-8">
                <h3 className="font-bold text-xs lg:text-sm text-land-ink mb-3 lg:mb-4 uppercase tracking-wider">
                  Kategori
                </h3>
                <div className="space-y-3 lg:space-y-4">
                  {KATEGORI_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2.5 lg:gap-3 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={kategori === opt.value}
                        onChange={() =>
                          setKategori((prev) =>
                            prev === opt.value ? "" : opt.value,
                          )
                        }
                        className="w-4 h-4 lg:w-5 lg:h-5 rounded-[4px] lg:rounded-[6px] border-[#E8E0D5] text-land-accent focus:ring-land-accent transition-colors cursor-pointer"
                      />
                      <span
                        className={`text-sm lg:text-base font-medium transition-colors group-hover:text-land-ink ${
                          kategori === opt.value
                            ? "text-land-accent font-semibold"
                            : "text-land-muted"
                        }`}
                      >
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Lokasi Asal */}
              <div className="mb-5 lg:mb-8">
                <h3 className="font-bold text-xs lg:text-sm text-land-ink mb-3 lg:mb-4 uppercase tracking-wider">
                  Lokasi Asal
                </h3>
                <div className="space-y-3 lg:space-y-4">
                  {PROVINSI_OPTIONS.map((loc) => (
                    <label
                      key={loc}
                      className="flex items-center gap-2.5 lg:gap-3 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={provinsi === loc}
                        onChange={() =>
                          setProvinsi((prev) => (prev === loc ? "" : loc))
                        }
                        className="w-4 h-4 lg:w-5 lg:h-5 rounded-[4px] lg:rounded-[6px] border-[#E8E0D5] text-land-accent focus:ring-land-accent transition-colors cursor-pointer"
                      />
                      <span
                        className={`text-sm lg:text-base font-medium transition-colors group-hover:text-land-ink ${
                          provinsi === loc
                            ? "text-land-accent font-semibold"
                            : "text-land-muted"
                        }`}
                      >
                        {loc}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="btn-clay-secondary w-full py-3.5"
              >
                Reset Semua Filter
              </button>
            </div>
          </div>

          {/* Product Grid */}
          <div className="w-full lg:w-3/4">
            <MarketplaceProducts
              filterParams={filterParams}
              userCoords={userCoords}
              onRequestLocation={handleRequestLocation}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
