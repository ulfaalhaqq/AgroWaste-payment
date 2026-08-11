"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { logout } from "@/lib/auth";

interface UserProfile {
  id: string;
  name: string;
  avatar_url?: string;
  logistik_profile?: {
    company_name: string | null;
  };
}

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar = ({ mobileOpen = false, onClose }: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();

  const [courierName, setCourierName] = useState("Kurir Logistik");
  const [courierId, setCourierId] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    apiFetch("/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.success && json?.data) {
          const user = json.data as UserProfile;
          setCourierName(user.name);
          setCourierId(user.id.slice(0, 8).toUpperCase());
          if (user.avatar_url) {
            setAvatarUrl(user.avatar_url);
          }
        }
      })
      .catch(() => {});

    apiFetch("/logistik/shipments")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.success && json?.data) {
          const list = json.data || [];
          // active = not yet delivered / completed
          const active = list.filter(
            (s: { status: string }) =>
              s.status !== "terkirim" && s.status !== "selesai",
          ).length;
          setPendingCount(active);
        }
      })
      .catch(() => {});
  }, [pathname]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const menuItems: {
    name: string;
    path: string;
    icon: string;
    badge?: number;
  }[] = [
    {
      name: "Dashboard",
      path: "/courier",
      icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
    },
    {
      name: "Shipments",
      path: "/courier/shipments",
      badge: pendingCount > 0 ? pendingCount : undefined,
      icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4",
    },
    {
      name: "Settings",
      path: "/courier/settings",
      icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    },
  ];

  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(courierName)}&background=2F5A28&color=fff&rounded=true`;

  return (
    <aside
      className={`
        w-64 h-screen fixed left-0 top-0 border-r border-courier-hairline bg-courier-warmbg
        flex flex-col z-30 transition-transform duration-300 ease-in-out
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      aria-label="Navigasi kurir"
    >
      {/* Brand Header */}
      <div className="h-24 flex items-center justify-between px-6 pt-4 gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-courier-primary text-white flex items-center justify-center shadow-md shadow-courier-primary/30">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10M13 16h4l4 4V10h-8z"
              />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-lg text-courier-primary leading-tight">
              Mitra
              <br />
              Logistik
            </h1>
            <p className="text-[10px] text-courier-textsecondary mt-0.5 tracking-wider">
              Courier Portal
            </p>
          </div>
        </div>
        {/* Mobile close button */}
        <button
          type="button"
          aria-label="Tutup navigasi"
          onClick={onClose}
          className="lg:hidden p-2 -mr-1 rounded-lg hover:bg-courier-primary/10 text-courier-textsecondary transition-colors"
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
      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive =
            item.path === "/courier"
              ? pathname === "/courier"
              : pathname?.startsWith(item.path);
          return (
            <Link
              key={item.name}
              href={item.path}
              onClick={onClose}
              className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive
                  ? "bg-courier-primary text-white shadow-md shadow-courier-primary/20"
                  : "text-courier-textsecondary hover:bg-courier-primary/5 hover:text-courier-textprimary"
              }`}
            >
              <svg
                className={`w-5 h-5 mr-3 flex-shrink-0 ${isActive ? "text-white" : "text-courier-textsecondary group-hover:text-courier-primary"}`}
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
                  className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? "bg-white text-courier-primary" : "bg-amber-500 text-white"}`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Profile & Logout Button */}
      <div className="p-4 border-t border-courier-hairline bg-courier-warmbg">
        <div className="flex items-center gap-3 mb-4 px-2">
          <img
            src={avatarUrl || fallbackAvatar}
            alt={courierName}
            className="w-10 h-10 rounded-full border border-courier-hairline object-cover"
          />
          <div className="min-w-0 flex-1">
            <h4
              className="text-sm font-bold text-courier-textprimary truncate"
              title={courierName}
            >
              {courierName}
            </h4>
            <span className="text-[10px] text-courier-textsecondary block truncate">
              ID: {courierId || "..."}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 text-courier-semred hover:text-red-700 font-semibold text-sm transition-colors w-full px-2 mt-2"
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
};
