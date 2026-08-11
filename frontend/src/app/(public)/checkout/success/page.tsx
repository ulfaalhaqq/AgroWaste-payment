import React from "react";
import Link from "next/link";
import {
  Check,
  Truck,
  Clock,
  Package,
  Sprout,
  ArrowRight,
  ShieldCheck,
  Heart,
} from "lucide-react";

export const metadata = {
  title: "Pembayaran Berhasil | AgroWaste",
};

export default function CheckoutSuccessPage() {
  return (
    <div className="flex-1 animate-fade-up pb-24 bg-land-bg">
      <div className="max-w-5xl mx-auto px-6 pt-16 text-center">
        {/* Success Header with Sonar Pulse */}
        <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
          <div className="absolute inset-0 rounded-full bg-[#E6F5EC] animate-ping opacity-75"></div>
          <div className="absolute inset-2 bg-white rounded-full border-4 border-[#009A44] flex items-center justify-center shadow-md z-10">
            <Check className="w-10 h-10 text-[#009A44]" strokeWidth={3} />
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-land-heading font-bold text-[#00662D] mb-3">
          Pembayaran Berhasil!
        </h1>
        <p className="text-land-muted text-sm md:text-base mb-12 max-w-lg mx-auto leading-relaxed">
          Kontribusi Anda membantu memicu pertumbuhan sirkular untuk masa depan
          bumi Nusantara yang bersih dan hijau.
        </p>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 text-left">
          {/* Receipt Card */}
          <div className="bg-white border border-[#E8E0D5]/80 rounded-[32px] p-6 md:p-8 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6 border-b border-[#E8E0D5] pb-4">
                <h2 className="text-lg font-bold text-land-ink font-land-heading">
                  Detail Transaksi
                </h2>
                <span className="px-3.5 py-1 bg-[#E6F5EC] text-[#009A44] text-[10px] font-bold tracking-widest uppercase rounded-full border border-[#B2DFCB]">
                  Lunas
                </span>
              </div>

              <div className="space-y-4 text-xs md:text-sm">
                <div className="flex justify-between">
                  <span className="text-land-muted">ID Transaksi</span>
                  <span className="font-bold text-land-ink font-mono">
                    AGW-882910
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-land-muted">Waktu Pembayaran</span>
                  <span className="font-bold text-land-ink font-tabular">
                    24 Okt 2026, 14:30 WIB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-land-muted">Metode Pembayaran</span>
                  <span className="font-bold text-land-ink">QRIS Gopay</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-dashed border-[#E8E0D5] mt-6 pt-6">
              <span className="font-bold text-land-ink text-base">
                Total Bayar
              </span>
              <span className="text-2xl font-bold text-[#009A44] font-tabular">
                Rp 425.000
              </span>
            </div>
          </div>

          {/* Delivery Timeline Card */}
          <div className="bg-white border border-[#E8E0D5]/80 rounded-[32px] p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-2.5 mb-6 border-b border-[#E8E0D5] pb-4">
              <Truck className="w-5 h-5 text-land-clay" />
              <h2 className="text-lg font-bold text-land-ink font-land-heading">
                Estimasi Logistik
              </h2>
            </div>

            <div className="relative pl-6 space-y-6 mb-6">
              <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-[#E8E0D5]"></div>

              {/* Step 1: Active */}
              <div className="relative">
                <div className="absolute -left-[25px] top-1 w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-white ring-4 ring-amber-100"></div>
                <h4 className="text-xs font-bold text-land-ink">
                  Dalam Persiapan Mitra
                </h4>
                <p className="text-[10px] text-land-muted leading-relaxed mt-0.5">
                  Limbah organik sedang disiapkan dan dikemas oleh Peternak.
                </p>
              </div>

              {/* Step 2: Inactive */}
              <div className="relative opacity-55">
                <div className="absolute -left-[25px] top-1 w-3.5 h-3.5 rounded-full bg-[#E8E0D5] border-2 border-white"></div>
                <h4 className="text-xs font-bold text-land-ink">
                  Dijemput Kurir Reguler
                </h4>
                <p className="text-[10px] text-land-muted leading-relaxed mt-0.5">
                  Estimasi penjemputan armada: Besok pagi pukul 09:00 WIB.
                </p>
              </div>
            </div>

            <div className="bg-[#FFF4E5] border border-[#FFD8A8] rounded-2xl p-4 flex gap-3 items-start shadow-sm">
              <Clock className="w-4 h-4 text-[#E67700] shrink-0 mt-0.5" />
              <p className="text-[10px] text-[#E67700] leading-relaxed">
                Armada AgroWaste memprioritaskan rute pengiriman rendah karbon
                melalui optimasi GIS untuk menghemat bahan bakar.
              </p>
            </div>
          </div>
        </div>

        {/* Environmental Impact Success Banner */}
        <div className="bg-[#2C3930] rounded-[32px] p-6 md:p-10 text-white shadow-xl relative overflow-hidden text-left mb-12 flex flex-col md:flex-row items-center gap-8 group hover:-translate-y-1 transition-transform duration-300">
          <div className="absolute right-0 top-0 w-80 h-80 bg-[#009A44] rounded-full blur-3xl opacity-35 -translate-y-1/2 translate-x-1/3 pointer-events-none group-hover:scale-105 transition-transform duration-700"></div>
          <div className="absolute left-0 bottom-0 w-40 h-40 bg-white rounded-full blur-3xl opacity-5 translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>

          <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
            <Sprout className="w-8 h-8 text-[#4ADE80]" />
          </div>

          <div className="relative z-10 flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-[9px] font-bold tracking-widest uppercase mb-3 text-[#4ADE80]">
              <Heart className="w-3 h-3 fill-[#4ADE80]" />
              Eco Achievement: Top 5% Green Buyer
            </div>
            <h2 className="text-xl md:text-2xl font-bold font-land-heading mb-2">
              Kontribusi Hijau Tercatat
            </h2>
            <p className="text-sm text-white/70 leading-relaxed">
              Transaksi ini berhasil mengalihkan{" "}
              <strong className="text-white">
                12.5 kg emisi gas metana/CO2e
              </strong>{" "}
              dari atmosfer bumi dengan mempercepat konversi limbah organik
              menjadi nutrisi tanah.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-lg mx-auto">
          <Link
            href="/pesanan"
            className="btn-clay-primary py-3.5 w-full flex items-center justify-center gap-2 shadow-md"
          >
            Lihat Status Pesanan
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/"
            className="btn-clay-secondary py-3.5 w-full flex items-center justify-center gap-2"
          >
            Kembali ke Beranda
          </Link>
        </div>

        <div className="mt-12 text-center text-[10px] text-land-muted font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 opacity-80">
          <ShieldCheck className="w-4 h-4 text-[#009A44]" />
          Transaksi Terlindungi oleh AgroWaste Pay
        </div>
      </div>
    </div>
  );
}
