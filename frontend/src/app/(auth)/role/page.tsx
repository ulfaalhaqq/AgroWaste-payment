import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Pilih Peran | AgroWaste",
};

export default function RoleSelectionPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-land-bg font-land-body relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-land-secondary/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-land-clay/5 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2"></div>

      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2.5 mb-8 md:mb-16 hover:opacity-85 transition-all w-max"
      >
        <img
          src="/LOGO.png"
          alt="AgroWaste Logo"
          className="h-8 w-auto object-contain"
        />
        <span className="text-2xl font-bold text-land-secondary font-land-heading tracking-tight">
          AgroWaste
        </span>
      </Link>

      {/* Header */}
      <div className="text-center mb-8 md:mb-12 animate-fade-up">
        <h1 className="text-3xl font-bold text-land-ink font-land-heading mb-3">
          Selamat Datang di AgroWaste
        </h1>
        <p className="text-land-muted text-sm max-w-md mx-auto">
          Silakan pilih peran Anda untuk memulai perjalanan dalam ekosistem
          perdagangan limbah pertanian organik.
        </p>
      </div>

      {/* Role Cards */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full mb-8 md:mb-16 animate-fade-in"
        style={{ "--animation-delay": "100ms" } as React.CSSProperties}
      >
        {/* Penjual (Peternak) */}
        <div className="bg-land-surface border border-land-cream hover:border-land-secondary hover:shadow-lg hover:shadow-land-secondary/5 rounded-2xl p-6 md:p-8 flex flex-col items-center text-center transition-all duration-300 group">
          <div className="w-16 h-16 bg-land-warm/60 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <svg
              className="w-8 h-8 text-land-secondary"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              ></path>
            </svg>
          </div>
          <h3 className="text-lg font-bold text-land-ink font-land-heading mb-3">
            Penjual (Peternak)
          </h3>
          <p className="text-xs text-land-muted leading-relaxed mb-8 flex-1">
            Kelola limbah peternakan Anda, jual sebagai pupuk organik, dan
            kembangkan bisnis hijau Anda secara lestari.
          </p>
          <Link
            href="/register?role=penjual"
            className="w-full py-3 bg-land-secondary hover:bg-land-secondary/90 text-white text-sm font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 min-h-[44px]"
          >
            Pilih & Lanjutkan
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
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              ></path>
            </svg>
          </Link>
        </div>

        {/* Pembeli (Petani) */}
        <div className="bg-land-surface border border-land-cream hover:border-land-clay hover:shadow-lg hover:shadow-land-clay/5 rounded-2xl p-6 md:p-8 flex flex-col items-center text-center transition-all duration-300 group">
          <div className="w-16 h-16 bg-land-clay/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <svg
              className="w-8 h-8 text-land-clay"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
          <h3 className="text-lg font-bold text-land-ink font-land-heading mb-3">
            Pembeli (Petani)
          </h3>
          <p className="text-xs text-land-muted leading-relaxed mb-8 flex-1">
            Cari, pesan, dan beli pupuk organik berkualitas tinggi langsung dari
            peternakan terpercaya pilihan Anda.
          </p>
          <Link
            href="/register?role=pembeli"
            className="w-full py-3 bg-land-clay hover:bg-land-clay-hover text-white text-sm font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 min-h-[44px]"
          >
            Pilih & Lanjutkan
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
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              ></path>
            </svg>
          </Link>
        </div>
      </div>

      {/* Footer Links */}
      <div
        className="flex flex-col items-center gap-4 text-sm font-semibold animate-fade-in"
        style={{ "--animation-delay": "200ms" } as React.CSSProperties}
      >
        <div className="text-land-muted">
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="text-land-clay hover:text-land-clay-hover"
          >
            Masuk di sini
          </Link>
        </div>
        <Link
          href="/"
          className="text-land-muted hover:text-land-ink flex items-center gap-1.5 transition-colors"
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            ></path>
          </svg>
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
