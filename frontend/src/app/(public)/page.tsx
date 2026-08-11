"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Leaf, Recycle, ShieldCheck, ArrowUpRight, Sprout } from "lucide-react";
import ImpactCalculator from "@/components/public/ImpactCalculator";
import { Marquee } from "@/components/public/Marquee";
import ImageSlider from "@/components/public/ImageSlider";
import FeaturedProducts from "@/components/public/FeaturedProducts";
import MapCn, { SellerInfo } from "@/components/public/MapCn";
import { apiFetch } from "@/lib/api";

interface ImpactData {
  total_waste_managed_kg: number;
  total_co2eq_reduced_kg: number;
  equivalent_trees: number;
  active_sellers_count: number;
  total_transactions: number;
}

interface ProductApiItem {
  peternak_profile?: {
    user_id: string;
    nama_peternakan?: string;
    lat?: string;
    lng?: string;
  };
  lat?: string;
  lng?: string;
  kabupaten?: string;
  provinsi?: string;
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function LandingPage() {
  const router = useRouter();
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [sellers, setSellers] = useState<SellerInfo[]>([]);
  const [activeSellerId, setActiveSellerId] = useState<string | null>(null);
  const [geoStatus, setGeoStatus] = useState<
    "idle" | "prompting" | "granted" | "denied"
  >("idle");
  const [loadingSellers, setLoadingSellers] = useState(true);
  const [impactData, setImpactData] = useState<ImpactData | null>(null);
  const [loadingImpact, setLoadingImpact] = useState(true);

  useEffect(() => {
    apiFetch("/dashboard/impact")
      .then((res) => (res.ok ? res.json() : { data: null }))
      .then((json) => {
        if (json.success && json.data) {
          setImpactData(json.data);
        }
        setLoadingImpact(false);
      })
      .catch(() => setLoadingImpact(false));
  }, []);

  const wasteMetric = impactData
    ? impactData.total_waste_managed_kg >= 1000
      ? {
          value: (impactData.total_waste_managed_kg / 1000).toLocaleString(
            "id-ID",
            { maximumFractionDigits: 1 },
          ),
          unit: "Ton",
        }
      : {
          value: impactData.total_waste_managed_kg.toLocaleString("id-ID"),
          unit: "kg",
        }
    : { value: "—", unit: "Ton" };

  const treesCount = impactData
    ? impactData.equivalent_trees.toLocaleString("id-ID")
    : "—";
  const activeSellers = impactData
    ? impactData.active_sellers_count >= 1000
      ? {
          value:
            (impactData.active_sellers_count / 1000).toLocaleString("id-ID", {
              maximumFractionDigits: 1,
            }) + "k",
        }
      : {
          value: impactData.active_sellers_count.toLocaleString("id-ID"),
        }
    : { value: "—" };

  // page title — must be set client-side
  useEffect(() => {
    document.title = "Beranda Utama | AgroWaste";
  }, []);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/products?sort=terbaru`)
      .then((r) => (r.ok ? r.json() : { data: { data: [] } }))
      .then((json) => {
        const list = json.data?.data ?? [];
        const uniqueSellersMap = new Map<string, SellerInfo>();

        list.forEach((p: ProductApiItem) => {
          const profile = p.peternak_profile;
          if (profile) {
            const lat = parseFloat(profile.lat || p.lat || "0");
            const lng = parseFloat(profile.lng || p.lng || "0");
            if (lat !== 0 && lng !== 0) {
              uniqueSellersMap.set(profile.user_id, {
                userId: profile.user_id,
                name: profile.nama_peternakan || "Peternak Organik",
                lat,
                lng,
                kabupaten: p.kabupaten || "Jawa Timur",
                provinsi: p.provinsi || "Indonesia",
              });
            }
          }
        });

        setSellers(Array.from(uniqueSellersMap.values()));
        setLoadingSellers(false);
      })
      .catch(() => setLoadingSellers(false));
  }, []);

  const requestLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGeoStatus("denied");
      return;
    }
    setGeoStatus("prompting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords([pos.coords.longitude, pos.coords.latitude]);
        setGeoStatus("granted");
      },
      () => {
        setGeoStatus("denied");
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  // sort sellers by proximity
  const sortedSellers = useMemo(() => {
    if (!userCoords) return sellers;

    const [uLng, uLat] = userCoords;
    const sellersWithDistance = sellers.map((s) => {
      const dist = getDistance(uLat, uLng, s.lat, s.lng);
      return { ...s, distance: dist };
    });

    return [...sellersWithDistance].sort(
      (a, b) => (a.distance || 0) - (b.distance || 0),
    );
  }, [userCoords, sellers]);

  return (
    <div className="flex-1 flex flex-col bg-land-bg">
      {/* Hero Section */}
      <section className="relative bg-land-bg overflow-hidden lg:min-h-[90dvh] flex items-center">
        {/* decorative cow photo — desktop only */}
        <div
          className="hidden lg:block absolute inset-y-0 right-0 w-[55%] pointer-events-none select-none"
          aria-hidden="true"
        >
          <div
            className="absolute inset-0"
            style={
              {
                maskImage:
                  "linear-gradient(to left, black 55%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to left, black 55%, transparent 100%)",
              } as React.CSSProperties
            }
          >
            <img
              src="/hero-sapi.jpeg"
              alt=""
              className="w-full h-full object-cover object-center"
              loading="eager"
            />
            {/* Earthy warm tint — harmonises photo with #FBFAF7 palette */}
            <div className="absolute inset-0 bg-[#F0EDE6] opacity-25 mix-blend-multiply pointer-events-none" />
          </div>
        </div>

        {/* text content, left column */}
        <div className="relative z-10 w-full px-4 sm:px-6 md:px-10 lg:px-16 pt-28 md:pt-3 pb-8 md:pb-12 max-w-7xl mx-auto">
          <div className="lg:max-w-[52%]">
            <p className="text-land-muted font-medium text-base md:text-lg mb-8 hero-fade-up">
              AgroWaste
            </p>

            <h1
              className="font-land-heading font-bold text-land-ink leading-[1.0] tracking-[-0.025em] mb-5 hero-fade-up"
              style={
                {
                  fontSize: "clamp(2rem, 8vw, 5rem)",
                  textWrap: "balance",
                  animationDelay: "60ms",
                } as React.CSSProperties
              }
            >
              Limbah ternak
              <br />
              punya <span className="text-[#009A44] italic">nilai.</span>
            </h1>

            <p
              className="font-land-heading font-bold text-land-clay mb-8 hero-fade-up"
              style={
                {
                  fontSize: "clamp(1.25rem, 3.5vw, 2.125rem)",
                  animationDelay: "140ms",
                } as React.CSSProperties
              }
            >
              Kami bantu jualkan.
            </p>

            <p
              className="text-land-muted text-lg leading-relaxed max-w-lg mb-12 hero-fade-up"
              style={{ animationDelay: "220ms" } as React.CSSProperties}
            >
              Hubungkan kotoran ternak dan hasil olahan pupukmu dengan
              petani yang butuh pupuk organik berkualitas.
            </p>

            {/* CTAs */}
            <div
              className="flex flex-wrap gap-4 hero-fade-up"
              style={{ animationDelay: "300ms" } as React.CSSProperties}
            >
              <Link href="/register?role=penjual" className="btn-clay-primary">
                Mulai Jual Limbah
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </Link>
              <Link href="/marketplace" className="btn-clay-secondary">
                Cari Pupuk Organik
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Marquee />

      {/* Mission Section */}
      <section className="py-10 md:py-12 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="bg-land-ink rounded-[32px] p-5 sm:p-8 md:p-16 flex flex-col gap-12 shadow-[0_8px_32px_rgba(44,57,48,0.15)] relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-land-secondary opacity-30 rounded-full blur-3xl pointer-events-none" />

          {/* Top Row: Mission Header & Description */}
          <div className="flex flex-col lg:flex-row justify-between items-start gap-8 w-full relative z-10">
            <div className="w-full lg:w-[48%]">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-land-bg text-xs font-bold tracking-widest uppercase mb-6 backdrop-blur-md border border-white/5">
                <Leaf className="w-4 h-4 text-land-accent" />
                Misi Kami
              </div>

              <h2
                className="font-land-heading font-bold text-land-bg text-3xl md:text-5xl leading-tight"
                style={{ textWrap: "balance" }}
              >
                Merajut harmoni antara peternakan & alam.
              </h2>
            </div>

            <div className="w-full lg:w-[48%] pt-2 lg:pt-14">
              <p className="text-land-warm/80 text-base md:text-lg leading-relaxed">
                Kami tidak sekadar platform jual-beli. AgroWaste lahir dari
                kegelisahan akan menumpuknya limbah organik yang mencemari
                lingkungan. Kami percaya, dengan sentuhan sirkular, apa yang
                tadinya sisa bisa menjadi nyawa baru bagi tanah Nusantara.
              </p>
            </div>
          </div>

          {/* 5-card layout */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 relative z-10 mt-4 lg:items-center">
            {/* Card 1 */}
            <div className="w-full h-[200px] md:h-[280px] rounded-[32px] overflow-hidden relative shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md flex items-center justify-center">
              <img
                src="/farm-card.jpeg"
                alt="Lahan Pertanian Organik"
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-black/20" />
              <div className="w-16 h-16 rounded-[20px] bg-white/95 backdrop-blur-md shadow-lg flex items-center justify-center z-10 transition-transform duration-300 hover:scale-110">
                <Leaf className="w-8 h-8 text-[#2E8A4E]" />
              </div>
            </div>

            {/* Card 2: stats */}
            <div className="w-full h-[240px] md:h-[340px] flex flex-col gap-4">
              <div className="bg-white border border-land-cream rounded-[24px] p-5 flex-1 flex flex-col justify-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                <div className="text-3xl font-bold text-land-ink font-land-heading font-tabular flex items-center">
                  {loadingImpact ? (
                    <span className="w-16 h-8 bg-land-cream/40 animate-pulse rounded inline-block"></span>
                  ) : (
                    `+${activeSellers.value}`
                  )}
                </div>
                <div className="font-bold text-xs text-land-ink mt-0.5 uppercase tracking-wider">
                  Mitra Peternak
                </div>
                <p className="text-[10px] text-land-muted mt-1 leading-normal font-medium">
                  Bergabung menyalurkan limbah ternak produktif.
                </p>
              </div>
              <div className="bg-[#DCE6E1] border border-[#C8DACF] rounded-[24px] p-5 flex-1 flex flex-col justify-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                <div className="text-3xl font-bold text-[#1E3E2A] font-land-heading font-tabular flex items-center">
                  {loadingImpact ? (
                    <span className="w-20 h-8 bg-black/10 animate-pulse rounded inline-block"></span>
                  ) : (
                    `${wasteMetric.value} ${wasteMetric.unit}`
                  )}
                </div>
                <div className="font-bold text-xs text-[#1E3E2A] mt-0.5 uppercase tracking-wider">
                  Ton Diolah
                </div>
                <p className="text-[10px] text-land-muted mt-1 leading-normal font-medium">
                  Berhasil dikonversi menjadi pupuk berkualitas.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="w-full h-[280px] md:h-[400px] rounded-[32px] overflow-hidden relative group shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
              <img
                src="/auth-bg.jpeg"
                alt="Aktivitas pertanian sirkular AgroWaste"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center z-10">
                <Recycle className="w-5 h-5 text-[#2E8A4E]" />
              </div>
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-[#FBFAF7] text-land-ink font-bold text-xs px-5 py-2.5 rounded-full shadow-md whitespace-nowrap z-10 border border-land-cream">
                Ekonomi Sirkular
              </div>
            </div>

            {/* Card 4 */}
            <div className="w-full h-[240px] md:h-[340px] rounded-[32px] bg-land-ink p-6 flex flex-col justify-between relative overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md group cursor-pointer border border-white/5">
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
              <div className="relative z-10">
                <span className="px-3 py-1 bg-white/10 border border-white/5 rounded-full text-[10px] font-bold text-white/90 uppercase tracking-widest w-max">
                  Misi Ekologis
                </span>
                <h3 className="font-land-heading font-bold text-xl text-white mt-6 leading-tight flex items-center">
                  {loadingImpact ? (
                    <span className="w-32 h-6 bg-white/20 animate-pulse rounded inline-block"></span>
                  ) : (
                    `Setara ${treesCount} Pohon Tumbuh`
                  )}
                </h3>
                <p className="text-[12px] text-white/70 mt-2.5 leading-relaxed font-medium">
                  Reduksi karbon dari pengolahan limbah organik sebanding dengan
                  penyerapan emisi oleh belasan ribu pohon.
                </p>
              </div>
              <div className="relative z-10 self-end">
                <ArrowUpRight className="w-5 h-5 text-emerald-400 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </div>

            {/* Card 5 */}
            <div className="w-full h-[200px] md:h-[280px] rounded-[32px] overflow-hidden relative group shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md flex flex-col justify-center items-center p-6 text-center">
              <img
                src="/petani-semprot.jpg"
                alt="Pertanian Sirkular Berkelanjutan"
                className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/20" />
              <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md shadow-sm flex items-center justify-center z-10 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <ArrowUpRight className="w-4 h-4 text-[#2E8A4E]" />
              </div>
              <div className="font-land-heading font-bold text-base text-white max-w-[150px] leading-snug relative z-10 drop-shadow-md">
                Pertanian Sirkular Berkelanjutan
              </div>
            </div>
          </div>
        </div>
      </section>

      <FeaturedProducts />

      {/* GIS Tracking Dark Section */}
      <section className="bg-[#1C231F] py-12 md:py-16 px-4 sm:px-6 text-white mt-8">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Kecerdasan Logistik
          </div>

          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
            <h2 className="text-3xl md:text-5xl font-land-heading font-bold max-w-2xl leading-tight">
              Temukan peternak organik terdekat dari{" "}
              <span className="text-emerald-400">lokasi Anda.</span>
            </h2>
            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-[#E8E0D5]">
              SISTEM GIS:{" "}
              <span className="text-emerald-400 font-bold">AKTIF</span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Map Container */}
            <div className="w-full lg:w-2/3 h-[450px] md:h-[520px] bg-[#000000] rounded-[32px] border border-white/10 relative overflow-hidden group shadow-clay">
              <MapCn
                userCoords={userCoords}
                sellers={sortedSellers}
                activeSellerId={activeSellerId}
                onSelectSeller={(s) => router.push("/sellers/" + s.userId)}
                className="w-full h-full"
              />
            </div>

            {/* Stats Sidebar */}
            <div className="w-full lg:w-1/3 flex flex-col gap-6">
              {/* Geolocation Status Card */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[24px] p-6 flex flex-col justify-between relative overflow-hidden group">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-bold text-white/60 uppercase tracking-widest">
                    Status Lokasi Anda
                  </span>
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      geoStatus === "granted"
                        ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)] animate-pulse"
                        : geoStatus === "prompting"
                          ? "bg-amber-400 animate-pulse"
                          : "bg-red-400"
                    }`}
                  />
                </div>

                {geoStatus === "granted" && userCoords ? (
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
                      Koordinat Anda:
                    </div>
                    <div className="text-sm font-mono text-emerald-300 font-tabular">
                      {userCoords[1].toFixed(5)}° S, {userCoords[0].toFixed(5)}°
                      E
                    </div>
                  </div>
                ) : geoStatus === "prompting" ? (
                  <p className="text-xs text-white/80">
                    Meminta izin lokasi perangkat...
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    <p className="text-xs text-white/60">
                      Akses lokasi tidak diaktifkan. Aktifkan GPS untuk melacak
                      peternak terdekat.
                    </p>
                    <button
                      onClick={requestLocation}
                      className="px-3.5 py-2 bg-land-accent hover:bg-land-accent-hover text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
                    >
                      Aktifkan Lokasi Saya
                    </button>
                  </div>
                )}
              </div>

              {/* Nearest Sellers List */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[24px] p-6 flex-1 flex flex-col justify-start overflow-hidden min-h-[280px]">
                <span className="text-[11px] font-bold text-white/60 uppercase tracking-widest mb-4 block">
                  Peternak Terdekat
                </span>

                {loadingSellers ? (
                  <div className="flex flex-col items-center justify-center py-10 flex-1 animate-pulse">
                    <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <span className="text-[10px] font-bold text-white/50">
                      Mencari peternak...
                    </span>
                  </div>
                ) : sortedSellers.length === 0 ? (
                  <p className="text-xs text-white/50 italic py-10 text-center">
                    Tidak ada lokasi peternak terverifikasi.
                  </p>
                ) : (
                  <div className="space-y-3 overflow-y-auto max-h-[280px] pr-1">
                    {sortedSellers.slice(0, 3).map((s) => (
                      <div
                        key={s.userId}
                        onClick={() => setActiveSellerId(s.userId)}
                        className={`p-3.5 rounded-xl border transition-all duration-300 cursor-pointer flex items-center justify-between gap-3 ${
                          activeSellerId === s.userId
                            ? "bg-land-accent/20 border-land-accent text-white"
                            : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <h4 className="font-bold text-sm truncate leading-snug">
                            {s.name}
                          </h4>
                          <p className="text-[10px] text-white/50 truncate mt-0.5">
                            {s.kabupaten}, {s.provinsi}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          {s.distance !== undefined ? (
                            <span className="text-xs font-bold text-emerald-300 font-tabular block">
                              {s.distance.toFixed(1)}{" "}
                              <span className="text-[10px] font-normal text-white/50">
                                km
                              </span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-white/40">
                              Lokasi
                            </span>
                          )}
                          <Link
                            href={`/sellers/${s.userId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block mt-1 hover:underline"
                          >
                            Lihat Profil
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Calculator */}
      <ImpactCalculator />
    </div>
  );
}
