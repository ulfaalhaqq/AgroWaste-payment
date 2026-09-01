"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { getUser, logout } from "@/lib/auth";

interface TopbarProps {
  onMenuToggle?: () => void;
}

const PAGE_TITLES: Record<string, string> = {
  "/admin": "Ringkasan Platform",
  "/admin/users": "Manajemen Pengguna",
  "/admin/listings": "Persetujuan Listing",
  "/admin/logistics": "Manajemen Logistik",
  "/admin/analytics": "Analitik & Dampak",
  "/admin/settings": "Pengaturan",
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  // Untuk halaman dinamis (mis. /admin/logistics/123), cari prefix terpanjang yang cocok
  const match = Object.keys(PAGE_TITLES)
    .filter((key) => key !== "/admin" && pathname.startsWith(key))
    .sort((a, b) => b.length - a.length)[0];
  return match ? PAGE_TITLES[match] : "Admin Panel";
}

export const Topbar = ({ onMenuToggle }: TopbarProps) => {
  const pathname = usePathname();
  const title = getPageTitle(pathname || "/admin");

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<{
    name?: string;
    email?: string;
    avatar_url?: string | null;
  } | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    window.dispatchEvent(new Event("auth-change"));
    window.location.href = "/login";
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "A";

  return (
    <header className="bg-admin-surfacewhite h-16 border-b border-admin-hairline px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20 gap-4">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label="Buka/tutup navigasi"
          onClick={onMenuToggle}
          className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-admin-warmbg text-admin-textsecondary transition-colors shrink-0"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Judul Halaman Dinamis */}
        <h1 className="text-base sm:text-lg font-bold text-admin-textprimary truncate">
          {title}
        </h1>
      </div>

      {/* Profil + Dropdown Logout */}
      <div className="relative shrink-0" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2.5 pl-2 pr-1 sm:pr-3 py-1.5 rounded-xl hover:bg-admin-warmbg transition-colors"
        >
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name || "Admin"}
              className="w-8 h-8 rounded-full object-cover border border-admin-hairline"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-admin-primary-light text-admin-primary flex items-center justify-center font-bold text-xs border border-admin-hairline">
              {initials}
            </div>
          )}
          <span className="hidden sm:block text-sm font-bold text-admin-textprimary truncate max-w-[120px]">
            {user?.name || "Admin"}
          </span>
          <svg
            className={`hidden sm:block w-3.5 h-3.5 text-admin-textsecondary transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
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

        {open && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-admin-hairline rounded-xl shadow-xl z-30 p-1.5 animate-fade-in">
            <div className="px-3 py-2 border-b border-admin-hairline mb-1">
              <p className="text-xs font-bold text-admin-textprimary truncate">
                {user?.name || "Admin"}
              </p>
              <p className="text-[11px] text-admin-textsecondary truncate">
                {user?.email || ""}
              </p>
            </div>
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
        )}
      </div>
    </header>
  );
};