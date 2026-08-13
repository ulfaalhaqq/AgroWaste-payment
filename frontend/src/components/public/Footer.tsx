import React from "react";
import Link from "next/link";
import { Mail, ArrowRight } from "lucide-react";
import { FaInstagram, FaWhatsapp } from "react-icons/fa";

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
          <div className="lg:w-6/12 flex flex-col gap-10">
            <div className="grid grid-cols-2 gap-10">
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
                  href="/role"
                  className="text-[#A0AAB2] hover:text-white transition-colors"
                >
                  Jual Limbah
                </Link>
                <a
                  href="https://wa.me/6283861298487?text=Halo%20Admin%20AgroWaste%2C%20saya%20ingin%20mendaftar%20sebagai%20Mitra%20Kurir%20Logistik."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#A0AAB2] hover:text-white transition-colors"
                >
                  Mitra Logistik
                </a>
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

                {/* Social Icons */}
                <div className="flex items-center gap-4 mt-2">
                  <a
                    href="https://instagram.com/agrowaste.ub"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram AgroWaste"
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-[#A0AAB2] hover:text-white hover:bg-white/10 transition-all hover:-translate-y-1"
                  >
                    <FaInstagram className="w-5 h-5" />
                  </a>
                  <a
                    href="https://wa.me/6283861298487"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp AgroWaste"
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-[#A0AAB2] hover:text-white hover:bg-white/10 transition-all hover:-translate-y-1"
                  >
                    <FaWhatsapp className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-center gap-4">
          <p className="text-sm font-bold text-[#A0AAB2]">
            &copy; {new Date().getFullYear()} AgroWaste. Hak cipta dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
}