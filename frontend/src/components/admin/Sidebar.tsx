"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { logout } from "@/lib/auth";

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar = ({ mobileOpen = false, onClose }: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [adminName, setAdminName] = useState("Administrator Utama");
  const [adminAvatar, setAdminAvatar] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.success && json?.data) {
          if (json.data.name) setAdminName(json.data.name);
          if (json.data.avatar_url) setAdminAvatar(json.data.avatar_url);
        }
      })
      .catch(() => {});

    apiFetch("/admin/products")
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json) => {
        const all = json.data ?? [];
        const pending = all.filter(
          (p: { status: string }) => p.status === "menunggu_review",
        );
        setPendingCount(pending.length);
      })
      .catch(() => {});
  }, [pathname]); // Reload when pathname changes to sync stats

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const menuItems = [
    {
      name: "Ringkasan",
      path: "/admin",
      icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
    },
    {
      name: "Manajemen Pengguna",
      path: "/admin/users",
      icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    },
    {
      name: "Persetujuan Listing",
      path: "/admin/listings",
      badge:
        pendingCount !== null && pendingCount > 0 ? pendingCount : undefined,
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
    },
    {
      name: "Logistik",
      path: "/admin/logistics",
      icon: "M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10M13 16h4l4 4V10h-8z",
    },
    {
      name: "Analitik Dampak",
      path: "/admin/analytics",
      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2",
    },
    {
      name: "Pengaturan",
      path: "/admin/settings",
      icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    },
  ];

  return (
    <aside
      className={`
        w-64 h-screen fixed left-0 top-0 border-r border-admin-hairline bg-[#EBE7E0]
        flex flex-col z-30 transition-transform duration-300 ease-in-out
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      aria-label="Navigasi admin"
    >
      {/* Brand header */}
      <div className="h-20 flex items-center justify-between px-6 pt-4">
        <Link
          href="/admin"
          className="flex items-center gap-2"
          onClick={onClose}
        >
          <span className="text-2xl font-bold text-admin-primary tracking-tight">
            AgroWaste
          </span>
        </Link>
        {/* Mobile close button */}
        <button
          type="button"
          aria-label="Tutup navigasi"
          onClick={onClose}
          className="lg:hidden p-2 -mr-1 rounded-lg hover:bg-admin-hairline text-admin-textsecondary transition-colors"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Profile */}
      <div className="px-6 py-6 border-b border-admin-hairline/50 mb-4">
        <div className="flex items-center gap-3">
          {adminAvatar ? (
            <img
              src={adminAvatar}
              alt="Admin Avatar"
              className="w-10 h-10 rounded-full object-cover border border-admin-hairline shadow-sm"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-admin-primary text-white flex items-center justify-center font-bold shadow-sm">
              {adminName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <span className="text-[10px] text-admin-primary font-bold uppercase tracking-wider block leading-tight">
              Panel Sistem
            </span>
            <h2 className="text-xs font-bold text-admin-textprimary leading-tight mt-0.5 truncate max-w-[130px]">
              {adminName}
            </h2>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive =
            item.path === "/admin"
              ? pathname === "/admin"
              : pathname?.startsWith(item.path);
          return (
            <Link
              key={item.name}
              href={item.path}
              onClick={onClose}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? "bg-admin-primary text-white shadow-md shadow-admin-primary/20"
                  : "text-admin-textsecondary hover:bg-admin-warmbg hover:text-admin-textprimary"
              }`}
            >
              <svg
                className={`w-5 h-5 mr-3 flex-shrink-0 ${isActive ? "text-white" : "text-admin-textsecondary group-hover:text-admin-primary"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={isActive ? 2.5 : 2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={item.icon}
                />
              </svg>
              <span
                className={`text-sm flex-1 ${isActive ? "font-bold" : "font-semibold"}`}
              >
                {item.name}
              </span>
              {item.badge && (
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? "bg-white text-admin-primary" : "bg-admin-semamber text-white"}`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-6 border-t border-admin-hairline/50">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 text-admin-semred hover:text-red-700 font-semibold text-sm transition-colors w-full px-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
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
    </aside>
  );
};
