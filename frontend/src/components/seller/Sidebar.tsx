"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { logout } from "@/lib/auth";

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [newOrdersCount, setNewOrdersCount] = useState(0);

  useEffect(() => {
    // badge count for new orders
    apiFetch("/seller/dashboard")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.success && json?.data) {
          setNewOrdersCount(Number(json.data.pesanan_baru || 0));
        }
      })
      .catch(() => {});
  }, [pathname]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const menuItems = [
    {
      name: "Dashboard",
      path: "/seller",
      icon: "M3 12l9-9 9 9M4 10v10a1 1 0 001 1h5v-6h4v6h5a1 1 0 001-1V10",
    },
    {
      name: "Inventaris",
      path: "/seller/inventory",
      icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    },
    {
      name: "Pesanan",
      path: "/seller/orders",
      badge: newOrdersCount > 0 ? newOrdersCount : undefined,
      icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
    },
    {
      name: "Lencana Dampak",
      path: "/seller/badges",
      icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
    },
    {
      name: "Pengaturan",
      path: "/seller/settings",
      icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    },
  ];

  return (
    <aside
      className={`
        w-64 h-screen fixed left-0 top-0 border-r border-seller-hairline bg-[#EBE7E0]
        flex flex-col z-30 transition-transform duration-300 ease-in-out
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      aria-label="Navigasi seller"
    >
      {/* Brand Header */}
      <div className="h-20 flex items-center justify-between px-6 pt-4 mb-4">
        <Link
          href="/seller"
          className="flex items-center gap-2"
          onClick={onClose}
        >
          <span className="text-2xl font-bold text-seller-primary tracking-tight">
            AgroWaste
          </span>
        </Link>
        {/* Mobile close button */}
        <button
          type="button"
          aria-label="Tutup navigasi"
          onClick={onClose}
          className="lg:hidden p-2 -mr-1 rounded-lg hover:bg-seller-hairline text-seller-textsecondary transition-colors"
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

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.name}
              href={item.path}
              onClick={onClose}
              className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? "bg-seller-primary text-white shadow-md shadow-seller-primary/20"
                  : "text-seller-textsecondary hover:bg-seller-warmbg hover:text-seller-textprimary"
              }`}
            >
              <svg
                className={`w-5 h-5 mr-3 flex-shrink-0 ${isActive ? "text-white" : "text-seller-textsecondary group-hover:text-seller-primary"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={isActive ? 2.5 : 2}
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

              {item.badge !== undefined && (
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? "bg-white text-seller-primary" : "bg-amber-500 text-white"}`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-6 border-t border-seller-hairline/50">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 text-seller-semred hover:text-red-700 font-semibold text-sm transition-colors w-full px-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
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
}