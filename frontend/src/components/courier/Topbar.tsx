"use client";

import { usePathname } from "next/navigation";

interface TopbarProps {
  onMenuToggle?: () => void;
}

export const Topbar = ({ onMenuToggle }: TopbarProps) => {
  const pathname = usePathname();

  const getPageTitle = () => {
    if (!pathname) return "Dashboard";
    if (pathname.includes("/shipments")) return "Shipments";
    if (pathname.includes("/impact")) return "Impact Tracker";
    if (pathname.includes("/payments")) return "Payments";
    if (pathname.includes("/settings")) return "Settings";
    return "Dashboard";
  };

  return (
    <header className="bg-courier-surfacewhite h-16 border-b border-courier-hairline px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20 gap-4">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label="Buka/tutup navigasi"
          onClick={onMenuToggle}
          className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-courier-primary/5 text-courier-textsecondary transition-colors shrink-0"
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
        <h1 className="text-xl font-bold text-courier-primary">
          {getPageTitle()}
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xl font-bold text-courier-primary hidden sm:inline">
          AgroWaste Mitra
        </span>
      </div>
    </header>
  );
};
