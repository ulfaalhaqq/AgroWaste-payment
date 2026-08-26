"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Leaf,
  Recycle,
  Globe2,
  Target,
  ShieldCheck,
  ArrowRight,
  LineChart,
  TreePine,
  Navigation,
} from "lucide-react";
import { Marquee } from "@/components/public/Marquee";
import { apiFetch } from "@/lib/api";
import Image from "next/image";
import { MapPin } from "lucide-react";

interface ImpactData {
  total_waste_managed_kg: number;
  total_co2eq_reduced_kg: number;
  equivalent_trees: number;
  active_sellers_count: number;
  total_transactions: number;
}

export default function AboutPage() {
  const [data, setData] = useState<ImpactData | null>(null);

  useEffect(() => {
    apiFetch("/dashboard/impact")
      .then((res) => (res.ok ? res.json() : { data: null }))
      .then((json) => {
        if (json?.success && json?.data) {
          setData(json.data);
        }
      })
      .catch(() => {});
  }, []);

  const totalWasteKg = data?.total_waste_managed_kg || 0;
  const wasteText =
    totalWasteKg >= 1000
      ? `${(totalWasteKg / 1000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} Ton`
      : `${totalWasteKg.toLocaleString("id-ID")} Kg`;
  return (
    <div className="flex-1 flex flex-col bg-land-bg">
      {/* Editorial Hero Section with Smooth Fade */}
      <section className="relative bg-land-bg overflow-hidden min-h-[75dvh] lg:min-h-[85dvh] flex items-center py-4">
        {/* Decorative photo — right side, fades left */}
        <div
          className="hidden lg:block absolute inset-y-0 right-0 w-[60%] pointer-events-none select-none"
          aria-hidden="true"
        >
          <div
            className="absolute inset-0"
            style={
              {
                maskImage:
                  "linear-gradient(to left, black 40%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to left, black 40%, transparent 100%)",
              } as React.CSSProperties
            }
          >
            <img
              src="/auth-bg.jpeg"
              alt=""
              className="w-full h-full object-cover object-center"
              loading="eager"
            />
            {/* Earthy warm tint */}
            <div className="absolute inset-0 bg-land-warm opacity-30 mix-blend-multiply pointer-events-none" />
          </div>
        </div>

        {/* Text content — left column */}
        <div className="relative z-10 w-full px-6 md:px-10 lg:px-16 pt-4 pb-8 md:pt-6 md:pb-12 max-w-7xl mx-auto">
          <div className="lg:max-w-[55%]">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-land-ink text-[10px] font-bold tracking-widest uppercase mb-8 shadow-sm border border-[#E8E0D5]">
              <Globe2 className="w-4 h-4 text-[#009A44]" />
              AgroWaste Manifesto
            </div>

            <h1
              className="text-5xl md:text-7xl font-land-heading font-bold text-land-ink leading-[1.05] tracking-tight mb-8"
              style={{ textWrap: "balance" }}
            >
              Membangun masa depan{" "}
              <span className="text-[#009A44] italic">pertanian sirkular.</span>
            </h1>

            <p className="text-land-muted text-lg md:text-xl leading-relaxed max-w-2xl mb-12">
              Kami tidak sekadar membangun aplikasi. AgroWaste hadir untuk
              memutus rantai pencemaran lingkungan dengan mengubah jutaan ton
              limbah ternak menjadi nutrisi tanah yang menghidupkan kembali
              lahan pertanian Nusantara.
            </p>

            <Link
              href="/marketplace"
              className="btn-clay-primary px-8 py-4 group"
            >
              Bergabung Bersama Kami
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <ArrowRight className="w-4 h-4 text-white" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      <Marquee />

      {/* Philosophy & SDGs (Asymmetric Bento Grid) */}
      <section className="py-24 bg-land-warm w-full relative overflow-hidden">
        {/* Background Blur Elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/40 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#009A44]/5 blur-3xl rounded-full translate-x-1/3 translate-y-1/3" />

        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Main Mission Card */}
            <div className="md:col-span-8 bg-white rounded-[40px] p-10 md:p-14 shadow-sm border border-white flex flex-col justify-between">
              <div>
                <Target className="w-10 h-10 text-land-clay mb-8" />
                <h2 className="text-3xl md:text-5xl font-land-heading font-bold text-land-ink mb-6 leading-tight">
                  Limbah bukan akhir, melainkan{" "}
                  <span className="text-land-clay">awal siklus baru.</span>
                </h2>
                <p className="text-land-muted text-lg leading-relaxed max-w-2xl">
                  AgroWaste memberdayakan peternak lokal untuk mengubah
                  tantangan lingkungan menjadi peluang ekonomi raksasa melalui
                  logistik cerdas dan teknologi geospasial.
                </p>
              </div>
              <div className="mt-16 pt-8 border-t border-[#E8E0D5] flex flex-wrap gap-8">
                <div>
                  <div className="text-[10px] text-land-muted font-bold tracking-widest uppercase mb-1">
                    Dampak Ekonomi
                  </div>
                  <div className="text-lg font-bold text-land-ink">
                    Monetisasi Limbah Aktif
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-land-muted font-bold tracking-widest uppercase mb-1">
                    Dampak Ekologi
                  </div>
                  <div className="text-lg font-bold text-land-ink">
                    Zero Waste Farming
                  </div>
                </div>
              </div>
            </div>

            {/* SDG 12 Card */}
            <div className="md:col-span-4 bg-[#BF8B2E] rounded-[40px] p-8 md:p-10 shadow-lg text-white flex flex-col justify-between relative overflow-hidden group hover:-translate-y-2 transition-transform duration-500">
              <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />

              <div className="flex items-center justify-between z-10 mb-2">
                <Recycle className="w-12 h-12 text-white/90" />
                <div className="text-[10px] font-bold tracking-widest uppercase text-white/90 border border-white/40 rounded-full px-3 py-1 bg-white/10 backdrop-blur-sm">
                  SDG Goal 12
                </div>
              </div>

              {/* Area Gambar SDG 12 (Utuh & Pas Tanpa Kepotong) */}
              <div className="my-2 relative w-full h-52 flex items-center justify-center bg-[#BF8B2E]">
                <img
                  src="/sdg12.png"
                  alt="SDG Goal 12 - Responsible Consumption and Production"
                  className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div className="z-10">
                <h3 className="text-2xl md:text-3xl font-land-heading font-bold leading-tight mb-3">
                  Produksi & Konsumsi Bertanggung Jawab
                </h3>
                <p className="text-white/90 text-sm leading-relaxed">
                  Menerapkan sistem manajemen limbah terintegrasi yang mencegah
                  pencemaran air dan tanah di sekitar area peternakan.
                </p>
              </div>
            </div>

            {/* SDG 13 Card */}
            <div className="md:col-span-6 bg-[#1C231F] rounded-[40px] p-10 shadow-lg text-white flex flex-col md:flex-row gap-8 items-center group hover:-translate-y-2 transition-transform duration-500">
              <div className="w-24 h-24 rounded-full bg-[#3F7E44] flex items-center justify-center shrink-0 group-hover:bg-[#3F7E44] transition-colors overflow-hidden p-4">
                <Image
                  src="/sdg/13.png"
                  alt="SDG 13 - Penanganan Perubahan Iklim"
                  width={64}
                  height={64}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-widest uppercase text-[#4ADE80] mb-3">
                  SDG Goal 13
                </div>
                <h3 className="text-2xl font-land-heading font-bold leading-tight mb-3">
                  Penanganan Perubahan Iklim
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  Meminimalisir emisi gas metana pembusukan terbuka dengan
                  mempercepat proses pengolahan kotoran menjadi kompos organik.
                </p>
              </div>
            </div>

            {/* Transparency Card */}
            <div className="md:col-span-6 bg-white rounded-[40px] p-10 shadow-sm border border-white flex flex-col md:flex-row gap-8 items-center group hover:-translate-y-2 transition-transform duration-500">
              <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                <MapPin className="w-10 h-10 text-blue-500" />
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-widest uppercase text-blue-500 mb-3">
                  Pilar Teknologi
                </div>
                <h3 className="text-2xl font-land-heading font-bold text-land-ink leading-tight mb-3">
                  Transparansi Logistik (GIS)
                </h3>
                <p className="text-land-muted text-sm leading-relaxed">
                  Pelacakan distribusi perpindahan limbah secara langsung
                  (real-time) memastikan keadilan harga dan efisiensi rute
                  pengiriman.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Alur Kerja Sirkular (Modern Vertical Timeline) */}
      <section className="py-24 px-6 max-w-[1000px] mx-auto w-full">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-land-heading font-bold text-land-ink mb-6">
            Alur Kerja Sirkular
          </h2>
          <p className="text-land-muted text-lg max-w-2xl mx-auto">
            Sistem kami dirancang untuk meminimalisir hambatan antara pasokan
            limbah dan kebutuhan pertanian, bergerak secepat alam berdaur ulang.
          </p>
        </div>

        <div className="relative">
          {/* Vertical Track */}
          <div className="absolute left-[39px] md:left-1/2 top-0 bottom-0 w-1 bg-[#E8E0D5] -translate-x-1/2" />

          <div className="space-y-16">
            {/* Step 1 */}
            <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-16 group">
              <div className="md:w-1/2 flex md:justify-end w-full pl-24 md:pl-0 order-2 md:order-1 text-left md:text-right">
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-[#E8E0D5] group-hover:shadow-lg transition-shadow">
                  <h3 className="text-xl font-bold text-land-ink mb-3">
                    1. Pasokan Peternak
                  </h3>
                  <p className="text-land-muted text-sm leading-relaxed">
                    Peternak mendaftarkan limbah mereka. Sistem memverifikasi
                    kualitas dan menetapkan jadwal pengangkutan yang transparan.
                  </p>
                </div>
              </div>
              <div className="absolute left-0 md:left-1/2 -translate-x-1/2 w-20 h-20 bg-white rounded-full border-8 border-land-bg flex items-center justify-center shadow-lg z-10 order-1 md:order-2">
                <div className="w-12 h-12 bg-[#009A44]/10 rounded-full flex items-center justify-center">
                  <span className="font-land-heading font-bold text-xl text-[#009A44]">
                    1
                  </span>
                </div>
              </div>
              <div className="md:w-1/2 hidden md:block order-3"></div>
            </div>

            {/* Step 2 */}
            <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-16 group">
              <div className="md:w-1/2 hidden md:block order-1"></div>
              <div className="absolute left-0 md:left-1/2 -translate-x-1/2 w-20 h-20 bg-white rounded-full border-8 border-land-bg flex items-center justify-center shadow-lg z-10 order-1 md:order-2">
                <div className="w-12 h-12 bg-[#F59E0B]/10 rounded-full flex items-center justify-center">
                  <span className="font-land-heading font-bold text-xl text-[#F59E0B]">
                    2
                  </span>
                </div>
              </div>
              <div className="md:w-1/2 w-full pl-24 md:pl-0 order-2 md:order-3 text-left">
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-[#E8E0D5] group-hover:shadow-lg transition-shadow">
                  <h3 className="text-xl font-bold text-land-ink mb-3">
                    2. Logistik Cerdas
                  </h3>
                  <p className="text-land-muted text-sm leading-relaxed">
                    Sistem GIS mengkalkulasi rute paling efisien untuk armada
                    kami mengambil dan mengantarkan pupuk mentah atau olahan.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-16 group">
              <div className="md:w-1/2 flex md:justify-end w-full pl-24 md:pl-0 order-2 md:order-1 text-left md:text-right">
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-[#E8E0D5] group-hover:shadow-lg transition-shadow">
                  <h3 className="text-xl font-bold text-land-ink mb-3">
                    3. Pertumbuhan Lahan
                  </h3>
                  <p className="text-land-muted text-sm leading-relaxed">
                    Pupuk organik murni tiba di lahan petani, siap mengembalikan
                    kesuburan makro tanah dengan biaya yang jauh lebih
                    bersahabat.
                  </p>
                </div>
              </div>
              <div className="absolute left-0 md:left-1/2 -translate-x-1/2 w-20 h-20 bg-white rounded-full border-8 border-land-bg flex items-center justify-center shadow-lg z-10 order-1 md:order-2">
                <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <span className="font-land-heading font-bold text-xl text-blue-500">
                    3
                  </span>
                </div>
              </div>
              <div className="md:w-1/2 hidden md:block order-3"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Impact Banner */}
      <section className="py-24 px-6 max-w-[1400px] mx-auto w-full mb-12">
        <div className="bg-[#1C231F] rounded-[48px] p-12 md:p-20 text-center relative overflow-hidden flex flex-col items-center">
          <div className="absolute top-0 left-0 w-full h-full opacity-30 mix-blend-overlay">
            <img
              src="/about-texture.jpeg"
              alt="Texture"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="relative z-10">
            <LineChart className="w-16 h-16 text-[#4ADE80] mx-auto mb-8" />
            <h2 className="text-4xl md:text-6xl font-land-heading font-bold text-white mb-8 leading-tight">
              Lebih dari{" "}
              <span className="text-[#009A44]">{data ? wasteText : "..."}</span>
              <br />
              limbah telah diselamatkan.
            </h2>
            <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto mb-12">
              Angka ini bukan sekadar statistik. Ini adalah bukti nyata bahwa
              kolaborasi antara peternak dan petani dapat menyembuhkan bumi
              kita.
            </p>
            <Link
              href="/impact"
              className="btn-clay-secondary !bg-white !text-land-ink hover:!bg-[#E8E0D5] px-8 py-4"
            >
              Lihat Laporan Dampak Detail
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
