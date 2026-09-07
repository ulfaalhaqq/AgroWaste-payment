"use client";

import { Sidebar } from "@/components/admin/Sidebar";
import { Topbar } from "@/components/admin/Topbar";
import AdminGuard from "@/components/admin/AdminGuard";
import { ReactNode, useState } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="admin-theme min-h-screen bg-admin-warmbg font-sans text-admin-textprimary flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[25] lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main content */}
      <div className="flex-1 min-w-0 w-full flex flex-col min-h-screen ml-0 lg:ml-64">
        <Topbar onMenuToggle={() => setMobileOpen((v) => !v)} />

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto pb-14">
          <div className="max-w-7xl mx-auto">
            <AdminGuard>{children}</AdminGuard>
          </div>
        </main>
      </div>
    </div>
  );
}