import React from "react";
import Link from "next/link";
import { Mail, ArrowRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#2C3930] text-[#E8E0D5] mt-auto rounded-t-[40px] md:rounded-t-[60px] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 pt-20 md:pt-32 pb-8">
        {/* Main Content: Asymmetric Layout */}
        <div className="flex flex-col lg:flex-row justify-between gap-16 lg:gap-24 mb-20">
          {/* Left: Brand Statement */}
          <div className="lg:w-5/12 flex flex-col">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 mb-8 group"
            >
              <img
                src="/LOGO.png"
                alt="AgroWaste Logo"
                className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              />
              <span className="text-2xl font-land-heading font-bold text-white tracking-tight">
                AgroWaste
              </span>
            </Link>
            <h2
              className="text-3xl md:text-5xl font-land-heading font-bold text-white leading-tight mb-8"
              style={{ textWrap: "balance" }}
            >
              Masa depan sirkular dimulai dari tanah.
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 mt-auto">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-[#009A44] text-white font-bold hover:bg-[#008139] transition-all hover:-translate-y-1"
              >
                Bergabung Sekarang
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="mailto:arumsalsabila027@gmail.com"
                className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all hover:-translate-y-1"
              >
                Hubungi Kami
              </a>
            </div>
          </div>

          {/* Right: Link Columns */}
          <div className="lg:w-6/12 grid grid-cols-2 gap-10">
            {/* Column 1 */}
            <div className="flex flex-col gap-6">
              <h4 className="font-bold text-white tracking-widest text-xs uppercase mb-2">
                Platform
              </h4>
              <Link
                href="/marketplace"
                className="text-[#A0AAB2] hover:text-white transition-colors"
              >
                Beli Organik
              </Link>
              <Link
                href="/seller"
                className="text-[#A0AAB2] hover:text-white transition-colors"
              >
                Jual Limbah
              </Link>
              <Link
                href="/courier"
                className="text-[#A0AAB2] hover:text-white transition-colors"
              >
                Mitra Logistik
              </Link>
            </div>

            {/* Column 2 */}
            <div className="flex flex-col gap-6">
              <h4 className="font-bold text-white tracking-widest text-xs uppercase mb-2">
                Perusahaan
              </h4>
              <Link
                href="/about"
                className="text-[#A0AAB2] hover:text-white transition-colors"
              >
                Cerita Kami
              </Link>
              <Link
                href="/impact"
                className="text-[#A0AAB2] hover:text-white transition-colors"
              >
                Laporan Dampak
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm font-bold text-[#A0AAB2]">
            &copy; {new Date().getFullYear()} AgroWaste. Hak cipta dilindungi.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="mailto:arumsalsabila027@gmail.com"
              aria-label="Email"
              className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-[#009A44] hover:border-[#009A44] transition-all hover:-translate-y-1"
            >
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
