"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { apiFetch, getProductImageUrl } from "@/lib/api";
import { getUser, logout, type AuthUser } from "@/lib/auth";

export function Header() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mounted, setMounted] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const fetchCartCount = () => {
    apiFetch("/cart-items")
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((j) => setCartCount((j.data as unknown[]).length))
      .catch(() => setCartCount(0));
  };

  const handleLogout = () => {
    logout();
    window.dispatchEvent(new Event("auth-change"));
    window.location.href = "/";
  };

  // close mobile menu when path changes
  React.useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // scroll + auth state setup
  React.useEffect(() => {
    setMounted(true);

    const checkAuth = () => {
      const loggedIn = document.cookie.includes("auth=1");
      setIsLoggedIn(loggedIn);
      if (loggedIn) {
        setUser(getUser());
        fetchCartCount();
      } else {
        setUser(null);
        setCartCount(0);
      }
    };
    checkAuth();

    window.addEventListener("auth-change", checkAuth);
    window.addEventListener("cart-change", fetchCartCount);

    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("auth-change", checkAuth);
      window.removeEventListener("cart-change", fetchCartCount);
    };
  }, []);

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-400 ${
        isScrolled || isMenuOpen
          ? "bg-white/96 backdrop-blur-md border-b border-neutral-100 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <img
            src="/LOGO.png"
            alt="AgroWaste Logo"
            className="h-8 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
          />
          <span className="font-display font-bold text-[1.35rem] tracking-tight text-land-dark transition-colors duration-300 group-hover:text-land-clay">
            AgroWaste
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-land-ink/70">
          {[
            { href: "/", label: "Beranda", active: pathname === "/" },
            {
              href: "/marketplace",
              label: "Pasar",
              active: pathname.startsWith("/marketplace"),
            },
            {
              href: "/pesanan",
              label: "Pesanan",
              active: pathname.startsWith("/pesanan"),
            },
            {
              href: "/impact",
              label: "Dampak",
              active: pathname.startsWith("/impact"),
            },
            {
              href: "/about",
              label: "Tentang",
              active: pathname.startsWith("/about"),
            },
          ].map(({ href, label, active }) => (
            <Link
              key={href}
              href={href}
              className={`transition-all duration-200 pb-0.5 ${
                active
                  ? "text-land-clay border-b-2 border-land-clay"
                  : "hover:text-land-clay hover:-translate-y-0.5"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3 md:gap-4">
          {mounted && isLoggedIn && (
            <Link
              href="/cart"
              className="relative p-2 transition-colors rounded-full text-land-dark/60 hover:text-land-clay hover:bg-neutral-100"
            >
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
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                ></path>
              </svg>
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-[#EF4444] text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-land-dark">
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {!mounted ? (
            <div className="w-24 h-10 bg-land-cream/10 animate-pulse rounded-full"></div>
          ) : !isLoggedIn ? (
            <div className="flex items-center gap-2 pl-4 border-l border-neutral-200">
              <Link
                href="/login"
                className="hidden sm:block px-4 py-2 text-sm font-semibold text-land-dark/70 hover:text-land-dark transition-colors rounded-full"
              >
                Masuk
              </Link>
              <Link
                href="/login"
                className="px-5 py-2.5 text-sm font-bold text-land-cream bg-land-clay hover:bg-land-clay-dk rounded-full transition-colors"
              >
                Daftar
              </Link>
            </div>
          ) : (
            <div className="relative pl-4 border-l border-neutral-200 group">
              <Link
                href="/profile"
                className="flex items-center gap-2 cursor-pointer"
                title="Profil Pengguna"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-land-cream/30 flex items-center justify-center bg-[#009A44]/10 text-[#009A44] font-bold text-sm">
                  {user?.avatar_url ? (
                    <img
                      src={getProductImageUrl(user.avatar_url)}
                      alt="Pengguna"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>
                      {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </span>
                  )}
                </div>
              </Link>

              {/* Dropdown muncul saat kursor diarahkan ke avatar */}
              <div className="absolute right-0 top-full pt-2 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 z-50">
                <div className="w-52 bg-white border border-neutral-100 rounded-xl shadow-xl p-1.5">
                  <div className="px-3 py-2 border-b border-neutral-100 mb-1">
                    <p className="text-xs font-bold text-land-dark truncate">
                      {user?.name || "Pengguna"}
                    </p>
                    <p className="text-[11px] text-land-dark/50 truncate">
                      {user?.email || ""}
                    </p>
                  </div>
                  <Link
                    href="/profile"
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-land-dark/70 hover:bg-neutral-50 rounded-lg transition-colors"
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
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Profil Saya
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Keluar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Hamburger Menu (Mobile) */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-land-dark/70 hover:text-land-clay focus:outline-none transition-colors rounded-full hover:bg-neutral-100"
            aria-label={isMenuOpen ? "Tutup menu" : "Buka menu"}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {isMenuOpen && (
        <nav className="md:hidden bg-white border-b border-neutral-100 shadow-lg px-6 py-4 flex flex-col gap-4 text-sm font-semibold text-land-ink/70">
          {[
            { href: "/", label: "Beranda", active: pathname === "/" },
            {
              href: "/marketplace",
              label: "Pasar",
              active: pathname.startsWith("/marketplace"),
            },
            {
              href: "/pesanan",
              label: "Pesanan",
              active: pathname.startsWith("/pesanan"),
            },
            {
              href: "/impact",
              label: "Dampak",
              active: pathname.startsWith("/impact"),
            },
            {
              href: "/about",
              label: "Tentang",
              active: pathname.startsWith("/about"),
            },
          ].map(({ href, label, active }) => (
            <Link
              key={href}
              href={href}
              className={`transition-all duration-200 py-2 border-b border-neutral-50 last:border-0 ${
                active
                  ? "text-land-clay pl-2 border-l-2 border-land-clay font-bold"
                  : "hover:text-land-clay hover:pl-2"
              }`}
            >
              {label}
            </Link>
          ))}

          {mounted && isLoggedIn && (
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 py-2 text-red-600 font-bold"
            >
              Keluar
            </button>
          )}
        </nav>
      )}
    </header>
  );
}