"use client";

import { useState } from "react";
import { Sidebar } from "@/components/seller/Sidebar";
import { Topbar } from "@/components/seller/Topbar";
import SellerGuard from "@/components/seller/SellerGuard";

export default function SellerDashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="seller-theme min-h-screen bg-seller-warmbg font-sans text-seller-textprimary flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[25] lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Kiri */}
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Konten Utama */}
      <main className="flex-1 min-w-0 w-full flex flex-col min-h-screen ml-0 lg:ml-64">
        <Topbar onMenuToggle={() => setMobileOpen((v) => !v)} />

        {/* Area Konten Dinamis */}
        <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <SellerGuard>{children}</SellerGuard>
          </div>
        </div>
      </main>
    </div>
  );
}