"use client";

import React from "react";
import { StatCard } from "./StatCard";

interface ListingApprovalHeaderSectionProps {
  pendingCount: number;
  approvedToday: number;
  rejectedWeekly: number;
}

export const ListingApprovalHeaderSection = ({
  pendingCount,
  approvedToday,
  rejectedWeekly,
}: ListingApprovalHeaderSectionProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight text-admin-textprimary">
          Listing Approval
        </h2>
        <p className="text-sm text-admin-textsecondary">
          Tinjau dan lakukan moderasi penawaran limbah tani yang diajukan oleh
          para penjual.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Pending"
          value={pendingCount}
          description="Butuh verifikasi segera"
          colorScheme="amber"
        />
        <StatCard
          title="Disetujui Hari Ini"
          value={approvedToday}
          description="Sesuai target harian"
          colorScheme="green"
        />
        <StatCard
          title="Ditolak (Mingguan)"
          value={rejectedWeekly}
          description="Rata-rata 5 per minggu"
          colorScheme="red"
        />
      </div>
    </div>
  );
};
