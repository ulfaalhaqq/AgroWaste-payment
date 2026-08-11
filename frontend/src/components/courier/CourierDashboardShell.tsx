"use client";

import { useState } from "react";
import { Sidebar } from "@/components/courier/Sidebar";
import { Topbar } from "@/components/courier/Topbar";
import CourierGuard from "@/components/courier/CourierGuard";

export default function CourierDashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="courier-theme min-h-screen bg-courier-surfacewhite font-sans text-courier-textprimary flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[25] lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Fixed Left */}
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 w-full flex flex-col min-h-screen ml-0 lg:ml-64">
        {/* Top Navigation */}
        <Topbar onMenuToggle={() => setMobileOpen((v) => !v)} />

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto bg-courier-surfacewhite">
          <div className="max-w-7xl mx-auto">
            <CourierGuard>{children}</CourierGuard>
          </div>
        </main>
      </div>
    </div>
  );
}
