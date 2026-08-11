"use client";

import React, { useState } from "react";
import { Leaf, Recycle, Star } from "lucide-react";

export default function ImpactCalculator() {
  const [volume, setVolume] = useState(100);

  // Khusus Transaksi Jual Beli Pupuk Organik Ternak
  const co2Reduced = (volume * 0.65).toFixed(1); // Jurnal IPCC: Reduksi 0.65 kg CO2 per kg pupuk
  const treesPlanted = Math.ceil(volume * 0.0108); // Konversi US EPA: Serapan 0.060 MT (60 kg) CO2 per pohon per tahun

  // Nilai Ekonomi Riil Pupuk Organik Matang di Indonesia (Rp 1.500 - Rp 3.000 / kg)
  const valueMin = Math.floor((volume * 1500) / 1000); // Batas bawah dalam ribu (k)
  const valueMax = Math.floor((volume * 3000) / 1000); // Batas atas dalam ribu (k)

  return (
    <section className="py-16 md:py-24 px-6 max-w-7xl mx-auto w-full">
      <div className="bg-land-warm rounded-[32px] p-8 md:p-12 lg:p-16 border border-land-cream/50 shadow-[0_8px_32px_rgba(44,57,48,0.05)]">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
          {/* Left: Copy & Slider */}
          <div className="w-full lg:w-1/2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-land-ink text-xs font-bold tracking-widest uppercase mb-6 shadow-sm">
              <Leaf className="w-4 h-4 text-[#4ADE80]" />
              Kalkulator Dampak
            </div>
            <h2
              className="font-land-heading font-bold text-land-ink text-3xl md:text-5xl leading-tight mb-6"
              style={{ textWrap: "balance" }}
            >
              Langkah kecil,
              <br />
              dampak nyata.
            </h2>
            <p className="text-land-muted text-base md:text-lg leading-relaxed mb-10">
              Setiap kilogram limbah yang tidak dibakar atau dibuang sembarangan
              adalah napas baru bagi bumi. Hitung kontribusi positif Anda
              menggunakan kalkulator sirkular kami.
            </p>

            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-land-cream/40">
              <div className="flex justify-between items-end mb-4">
                <span className="text-xs font-bold text-land-muted uppercase tracking-wider">
                  Volume Limbah
                </span>
                <span className="font-land-heading text-2xl font-bold text-[#009A44]">
                  {volume} kg
                </span>
              </div>

              {/* Interactive Slider */}
              <div className="relative pt-2 pb-6">
                <input
                  type="range"
                  min="10"
                  max="1000"
                  step="10"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  style={{
                    background: `linear-gradient(to right, #009A44 ${((volume - 10) / 990) * 100}%, #E8E0D5 ${((volume - 10) / 990) * 100}%)`,
                  }}
                  className="w-full h-3 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-[#009A44] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md hover:[&::-webkit-slider-thumb]:scale-110 [&::-webkit-slider-thumb]:transition-transform"
                  aria-label="Volume limbah dalam kilogram"
                />
                <div className="flex justify-between text-[11px] font-bold text-land-muted mt-3">
                  <span>10 kg</span>
                  <span>1000 kg</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Results Cards */}
          <div className="w-full lg:w-1/2 flex flex-col gap-5">
            <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_24px_rgba(44,57,48,0.03)] border border-land-cream/30 flex items-center justify-between group hover:-translate-y-1 transition-transform">
              <div>
                <div className="text-[11px] font-bold text-land-muted uppercase tracking-widest mb-1">
                  CO₂e Berkurang (Reduksi Emisi Metana)
                </div>
                <div className="text-3xl font-land-heading font-bold text-land-ink">
                  {co2Reduced}{" "}
                  <span className="text-lg text-land-muted font-normal">
                    kg
                  </span>
                </div>
              </div>
              <div className="w-14 h-14 rounded-full bg-[#E6F5EC] flex items-center justify-center shrink-0">
                <Leaf className="w-6 h-6 text-[#009A44]" />
              </div>
            </div>

            <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_24px_rgba(44,57,48,0.03)] border border-land-cream/30 flex items-center justify-between group hover:-translate-y-1 transition-transform">
              <div>
                <div className="text-[11px] font-bold text-land-muted uppercase tracking-widest mb-1">
                  Setara Penanaman
                </div>
                <div className="text-3xl font-land-heading font-bold text-land-ink">
                  {treesPlanted}{" "}
                  <span className="text-lg text-land-muted font-normal">
                    Pohon
                  </span>
                </div>
              </div>
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Recycle className="w-6 h-6 text-[#3B82F6]" />
              </div>
            </div>

            <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_24px_rgba(44,57,48,0.03)] border border-[#009A44]/20 flex items-center justify-between group hover:-translate-y-1 transition-transform relative overflow-hidden">
              <div className="absolute inset-0 bg-[#E6F5EC]/50 pointer-events-none" />
              <div className="relative z-10">
                <div className="text-[11px] font-bold text-[#009A44] uppercase tracking-widest mb-1">
                  Potensi Nilai Ekonomi
                </div>
                <div className="text-3xl font-land-heading font-bold text-land-ink">
                  Rp {valueMin}k{" "}
                  <span className="text-lg text-land-muted font-normal">
                    - {valueMax}k
                  </span>
                </div>
              </div>
              <div className="w-14 h-14 rounded-full bg-[#009A44] flex items-center justify-center shrink-0 relative z-10 shadow-lg shadow-[#009A44]/30">
                <Star className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
