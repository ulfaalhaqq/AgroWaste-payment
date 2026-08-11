"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/admin/Toast";

interface Courier {
  id: string;
  company_name: string;
  vehicle_plate: string;
  lat?: number | string | null;
  lng?: number | string | null;
  kecamatan?: string | null;
  kabupaten?: string | null;
  provinsi?: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    avatar_url?: string | null;
  };
}

interface OrderItem {
  id: string;
  product_id: string;
  quantity_kg: number;
  price_per_kg: string;
  product?: {
    id: string;
    name: string;
  };
}

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  updated_at: string;
  status: string;
  total_price: number;
  quantity_kg: number;
  metode_pengiriman: string;
  alamat_pengiriman: string;
  user?: {
    id: string;
    name: string;
  };
  peternak?: {
    id: string;
    name: string;
    peternak_profile?: {
      nama_peternakan: string;
      kabupaten: string;
      lat?: number | string | null;
      lng?: number | string | null;
    };
  };
  items?: OrderItem[];
}

interface Shipment {
  id: string;
  order_id: string;
  logistik_profile_id: string;
  status: string;
  tracking_notes?: string;
  logistik_profile?: Courier;
}

function calculateDistanceKm(
  lat1?: number | string | null,
  lng1?: number | string | null,
  lat2?: number | string | null,
  lng2?: number | string | null
): number | null {
  if (!lat1 || !lng1 || !lat2 || !lng2) return null;
  const nLat1 = Number(lat1);
  const nLng1 = Number(lng1);
  const nLat2 = Number(lat2);
  const nLng2 = Number(lng2);
  if (isNaN(nLat1) || isNaN(nLng1) || isNaN(nLat2) || isNaN(nLng2)) return null;

  const R = 6371; // Earth radius in km
  const dLat = ((nLat2 - nLat1) * Math.PI) / 180;
  const dLng = ((nLng2 - nLng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((nLat1 * Math.PI) / 180) *
      Math.cos((nLat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export default function AdminLogistics() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Semua");
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedCourierId, setSelectedCourierId] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const shipmentsRes = await apiFetch("/admin/shipments");
      const couriersRes = await apiFetch("/admin/couriers");

      if (shipmentsRes.ok && couriersRes.ok) {
        const sJson = await shipmentsRes.json();
        const cJson = await couriersRes.json();

        setOrders(sJson.data.orders ?? []);
        setShipments(sJson.data.shipments ?? []);
        setCouriers(cJson.data ?? []);
      } else {
        showToast("Gagal mengambil data dari server.", "error");
      }
    } catch {
      showToast("Terjadi kesalahan koneksi.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const sortedCouriersForSelectedOrder = useMemo(() => {
    if (!selectedOrder) return couriers.map((c) => ({ courier: c, distanceKm: null }));

    const sellerLat = selectedOrder.peternak?.peternak_profile?.lat;
    const sellerLng = selectedOrder.peternak?.peternak_profile?.lng;

    const list = couriers.map((c) => {
      const dist = calculateDistanceKm(sellerLat, sellerLng, c.lat, c.lng);
      return {
        courier: c,
        distanceKm: dist,
      };
    });

    list.sort((a, b) => {
      if (a.distanceKm === null && b.distanceKm === null) return 0;
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    });

    return list;
  }, [couriers, selectedOrder]);

  const handleAssignClick = (order: Order) => {
    setSelectedOrder(order);
    const sellerLat = order.peternak?.peternak_profile?.lat;
    const sellerLng = order.peternak?.peternak_profile?.lng;

    const list = couriers.map((c) => ({
      id: c.id,
      dist: calculateDistanceKm(sellerLat, sellerLng, c.lat, c.lng),
    }));
    list.sort((a, b) => {
      if (a.dist === null && b.dist === null) return 0;
      if (a.dist === null) return 1;
      if (b.dist === null) return -1;
      return a.dist - b.dist;
    });

    setSelectedCourierId(list[0]?.id ?? couriers[0]?.id ?? "");
    setIsAssignModalOpen(true);
  };

  const handleConfirmAssign = async () => {
    if (!selectedOrder || !selectedCourierId) return;
    try {
      const res = await apiFetch("/admin/shipments/assign", {
        method: "POST",
        body: JSON.stringify({
          order_id: selectedOrder.id,
          logistik_profile_id: selectedCourierId,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showToast("Kurir berhasil ditugaskan ke pesanan.", "success");
        setIsAssignModalOpen(false);
        fetchData();
      } else {
        showToast(json.message ?? "Gagal menugaskan kurir.", "error");
      }
    } catch {
      showToast("Gagal terhubung ke server.", "error");
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (activeTab === "Semua") return true;
    if (activeTab === "Sedang Kirim") return order.status === "dikirim";
    if (activeTab === "Terkirim") return order.status === "selesai";
    if (activeTab === "Masalah")
      return order.status === "dibatalkan" || order.status === "ditolak";
    return true;
  });

  const totalShipmentsCount = orders.length;
  const activeShipmentsCount = orders.filter(
    (o) => o.status === "dikirim",
  ).length;
  const pendingAssignmentCount = orders.filter(
    (o) => o.status === "dikonfirmasi",
  ).length;

  // "late" = dikirim > 24 hours ago and not yet selesai
  const lateShipmentsCount = orders.filter((o) => {
    if (o.status !== "dikirim") return false;
    const shippedDate = new Date(o.updated_at);
    const timeDiffHours =
      (Date.now() - shippedDate.getTime()) / (1000 * 60 * 60);
    return timeDiffHours > 24;
  }).length;

  const tabs = ["Semua", "Sedang Kirim", "Terkirim", "Masalah"];

  const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);
  const [courierName, setCourierName] = useState("");
  const [courierEmail, setCourierEmail] = useState("");
  const [courierPhone, setCourierPhone] = useState("");
  const [courierPassword, setCourierPassword] = useState("");
  const [isCreatingCourier, setIsCreatingCourier] = useState(false);

  const handleCreateCourier = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingCourier(true);

    try {
      const res = await apiFetch("/admin/couriers", {
        method: "POST",
        body: JSON.stringify({
          name: courierName,
          email: courierEmail,
          phone: courierPhone,
          password: courierPassword,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showToast("Akun Kurir berhasil dibuat!", "success");
        setCourierName("");
        setCourierEmail("");
        setCourierPhone("");
        setCourierPassword("");
        setIsCourierModalOpen(false);
        fetchData();
      } else {
        showToast(json.message || "Gagal membuat akun kurir.", "error");
      }
    } catch {
      showToast("Terjadi kesalahan koneksi saat membuat akun kurir.", "error");
    } finally {
      setIsCreatingCourier(false);
    }
  };

  return (
    <>
      <div className="space-y-8 animate-fade-in pb-10">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-admin-textprimary mb-1">
              Manajemen Logistik
            </h2>
            <p className="text-sm text-admin-textsecondary">
              Pantau jadwal pengiriman dan penugasan kurir di lapangan.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCourierModalOpen(true)}
              className="px-4 py-2.5 bg-admin-primary text-white font-bold text-xs rounded-xl hover:bg-admin-primary/90 flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Buat Akun Kurir
            </button>
            <button
              onClick={() => fetchData()}
              className="px-4 py-2.5 bg-admin-surfacewhite text-admin-textsecondary font-bold text-xs border border-admin-hairline rounded-xl hover:bg-admin-warmbg flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18v3z"
                />
              </svg>
              Segarkan Data
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* KPI 1 */}
          <div className="bg-admin-surfacewhite border border-admin-hairline rounded-2xl p-6 relative group overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-admin-primary/5 rounded-bl-full -mr-4 -mt-4"></div>
            <div className="w-10 h-10 bg-admin-primary-light text-admin-primary rounded-xl flex items-center justify-center mb-4">
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
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-admin-textsecondary tracking-wider uppercase block mb-1">
              TOTAL PENGIRIMAN
            </span>
            <div className="text-3xl font-bold font-tabular text-admin-textprimary">
              {loading ? "..." : totalShipmentsCount.toLocaleString("id-ID")}
            </div>
          </div>

          {/* KPI 2 */}
          <div className="bg-admin-surfacewhite border border-admin-hairline rounded-2xl p-6 relative group overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/5 rounded-bl-full -mr-4 -mt-4"></div>
            <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center mb-4">
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
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-admin-textsecondary tracking-wider uppercase block mb-1">
              SEDANG BERJALAN
            </span>
            <div className="text-3xl font-bold font-tabular text-admin-textprimary">
              {loading ? "..." : activeShipmentsCount.toLocaleString("id-ID")}
            </div>
          </div>

          {/* KPI 3 */}
          <div className="bg-admin-surfacewhite border border-admin-hairline rounded-2xl p-6 relative group overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-admin-semamber/5 rounded-bl-full -mr-4 -mt-4"></div>
            <div className="w-10 h-10 bg-amber-50 text-admin-semamber rounded-xl flex items-center justify-center mb-4">
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
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-admin-textsecondary tracking-wider uppercase block mb-1">
              MENUNGGU PENUGASAN
            </span>
            <div className="text-3xl font-bold font-tabular text-admin-textprimary text-admin-semamber">
              {loading ? "..." : pendingAssignmentCount.toLocaleString("id-ID")}
            </div>
          </div>

          {/* KPI 4 */}
          <div className="bg-admin-surfacewhite border border-admin-hairline rounded-2xl p-6 relative group overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-admin-semred/5 rounded-bl-full -mr-4 -mt-4"></div>
            <div className="w-10 h-10 bg-red-50 text-admin-semred rounded-xl flex items-center justify-center mb-4">
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-admin-textsecondary tracking-wider uppercase block mb-1">
              TERLAMBAT (&gt;24J)
            </span>
            <div className="text-3xl font-bold font-tabular text-admin-semred">
              {loading ? "..." : lateShipmentsCount.toLocaleString("id-ID")}
            </div>
          </div>
        </div>

        {/* Main Table Container */}
        <div className="bg-admin-surfacewhite border border-admin-hairline rounded-2xl overflow-hidden">
          {/* Tab Filters */}
          <div className="p-6 border-b border-admin-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex bg-admin-warmbg p-1.5 rounded-xl gap-1 max-w-full overflow-x-auto w-full sm:w-auto">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 font-bold rounded-lg text-xs transition-all ${
                    activeTab === tab
                      ? "bg-admin-surfacewhite text-admin-primary shadow-sm"
                      : "text-admin-textsecondary hover:text-admin-textprimary"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="text-sm font-medium text-admin-textsecondary font-tabular">
              Menampilkan{" "}
              <span className="font-bold text-admin-textprimary">
                {filteredOrders.length}
              </span>{" "}
              dari {orders.length} pesanan
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-20 text-center text-admin-textsecondary text-sm font-semibold">
                Memuat data logistik...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-20 text-center text-admin-textsecondary text-sm font-semibold">
                Tidak ada data logistik untuk filter ini.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-admin-hairline bg-[#F9F8F6] text-[10px] font-bold text-admin-textsecondary uppercase tracking-wider">
                    <th className="px-6 py-4">ORDER NUMBER</th>
                    <th className="px-6 py-4">TANGGAL & WAKTU</th>
                    <th className="px-6 py-4">PIHAK TERKAIT</th>
                    <th className="px-6 py-4">KURIR DITUGASKAN</th>
                    <th className="px-6 py-4">STATUS</th>
                    <th className="px-6 py-4 text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-hairline">
                  {filteredOrders.map((order) => {
                    const orderShipment = shipments.find(
                      (s) => s.order_id === order.id,
                    );
                    const courierName =
                      orderShipment?.logistik_profile?.company_name ??
                      orderShipment?.logistik_profile?.user?.name ??
                      "Belum Ditugaskan";
                    const vehiclePlate =
                      orderShipment?.logistik_profile?.vehicle_plate ?? "";

                    // status → badge
                    let statusText = "Menunggu";
                    let statusBadge =
                      "bg-admin-semamber/10 text-admin-semamber";
                    let statusDot = "bg-admin-semamber";

                    if (order.status === "menunggu_pembayaran") {
                      statusText = "Menunggu Pembayaran";
                      statusBadge = "bg-admin-semamber/10 text-admin-semamber";
                      statusDot = "bg-admin-semamber";
                    } else if (order.status === "dikonfirmasi") {
                      statusText = "Menunggu Penugasan";
                      statusBadge = "bg-admin-semamber/10 text-admin-semamber";
                      statusDot = "bg-admin-semamber";
                    } else if (order.status === "dikirim") {
                      statusText = "Sedang Dikirim";
                      statusBadge = "bg-blue-50 text-blue-600";
                      statusDot = "bg-blue-500";
                    } else if (order.status === "selesai") {
                      statusText = "Terkirim";
                      statusBadge = "bg-admin-semgreen/10 text-admin-semgreen";
                      statusDot = "bg-admin-semgreen";
                    } else if (
                      order.status === "ditolak" ||
                      order.status === "dibatalkan"
                    ) {
                      statusText = "Dibatalkan";
                      statusBadge = "bg-admin-semred/10 text-admin-semred";
                      statusDot = "bg-admin-semred";
                    }

                    const orderDate = new Date(
                      order.created_at,
                    ).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    });
                    const orderTime =
                      new Date(order.created_at).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      }) + " WIB";

                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-admin-warmbg/40 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <span className="font-bold text-admin-primary">
                            {order.order_number ??
                              "AW-" + order.id.substring(0, 8).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-admin-textprimary">
                            {orderDate}
                          </div>
                          <div className="text-xs font-bold text-admin-textsecondary font-tabular">
                            {orderTime}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5 text-xs font-semibold text-admin-textprimary">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 bg-admin-semgreen/10 text-admin-semgreen flex items-center justify-center rounded text-[10px] font-bold">
                                P
                              </span>
                              <span>
                                {order.peternak?.peternak_profile
                                  ?.nama_peternakan ??
                                  order.peternak?.name ??
                                  "Peternakan"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 bg-blue-100 text-blue-600 flex items-center justify-center rounded text-[10px] font-bold">
                                B
                              </span>
                              <span>{order.user?.name ?? "Pembeli"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {courierName === "Belum Ditugaskan" ? (
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full border-2 border-dashed border-admin-hairline bg-admin-warmbg flex items-center justify-center">
                                <svg
                                  className="w-4 h-4 text-admin-textsecondary"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                                  />
                                </svg>
                              </div>
                              <span className="text-sm font-bold text-admin-textsecondary italic">
                                {courierName}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              {orderShipment?.logistik_profile?.user?.avatar_url ? (
                                <img
                                  src={orderShipment.logistik_profile.user.avatar_url}
                                  alt={courierName}
                                  className="w-10 h-10 rounded-full object-cover border border-admin-hairline group-hover:border-admin-primary transition-colors"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-admin-primary-light text-admin-primary flex items-center justify-center text-sm font-bold">
                                  {courierName.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-bold text-admin-textprimary group-hover:text-admin-primary transition-colors">
                                  {courierName}
                                </div>
                                {vehiclePlate && (
                                  <div className="text-[10px] font-bold text-admin-textsecondary font-tabular">
                                    {vehiclePlate}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${statusBadge}`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${statusDot}`}
                            ></span>
                            {statusText}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleAssignClick(order)}
                            className="px-3.5 py-1.5 text-xs font-bold text-admin-primary bg-admin-primary-light hover:bg-admin-primary/20 rounded-xl transition-all border border-admin-primary/20 cursor-pointer flex items-center gap-1.5 mx-auto"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            {courierName !== "Belum Ditugaskan" ? "Ubah Kurir" : "Tugaskan Kurir"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Assign Courier Modal */}
      {isAssignModalOpen && selectedOrder && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-admin-surfacewhite w-full max-w-md rounded-2xl border border-admin-hairline overflow-hidden shadow-xl animate-fade-in p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-admin-textprimary">
                Tugaskan Kurir Logistik
              </h3>
              <p className="text-xs text-admin-textsecondary mt-1">
                Pilih mitra logistik terdaftar untuk menjemput komoditas limbah
                pesanan{" "}
                <span className="font-semibold text-admin-textprimary">
                  {selectedOrder.order_number ??
                    "AW-" + selectedOrder.id.substring(0, 8).toUpperCase()}
                </span>
                .
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-admin-textsecondary">
                    Pilih Kurir (Urut Terdekat dari Penjual)
                  </label>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 font-extrabold px-2 py-0.5 rounded border border-emerald-200">
                    Auto GIS Jarak Terdekat
                  </span>
                </div>
                {couriers.length === 0 ? (
                  <div className="p-3 border border-admin-hairline rounded-xl text-xs text-admin-semred bg-red-50">
                    Tidak ada kurir yang aktif. Harap daftarkan mitra logistik
                    baru terlebih dahulu.
                  </div>
                ) : (
                  <select
                    value={selectedCourierId}
                    onChange={(e) => setSelectedCourierId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-admin-warmbg border border-admin-hairline rounded-xl text-sm text-admin-textprimary focus:outline-none focus:ring-1 focus:ring-admin-primary font-medium"
                  >
                    {sortedCouriersForSelectedOrder.map((item: { courier: Courier; distanceKm: number | null }, idx: number) => {
                      const c = item.courier;
                      const isClosest = idx === 0 && item.distanceKm !== null;
                      const distText =
                        item.distanceKm !== null
                          ? `${item.distanceKm} km dari Peternak`
                          : "Lokasi GPS belum diset";
                      const label = `${c.company_name ?? c.user.name} (${c.vehicle_plate ?? "Tanpa Plat"}) — ${distText}${isClosest ? " [⭐ TERDEKAT]" : ""}`;
                      return (
                        <option key={c.id} value={c.id}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              <div className="p-4 bg-admin-warmbg/50 rounded-xl space-y-2 border border-admin-hairline text-xs text-admin-textsecondary">
                <div className="flex justify-between">
                  <span>Alamat Pengiriman:</span>
                  <span className="font-bold text-admin-textprimary text-right max-w-[200px] truncate">
                    {selectedOrder.alamat_pengiriman ?? "Ambil di Peternakan"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Berat:</span>
                  <span className="font-bold text-admin-textprimary font-tabular">
                    {selectedOrder.quantity_kg.toLocaleString("id-ID")} kg
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2.5 text-xs font-bold text-admin-textsecondary bg-admin-surfacewhite border border-admin-hairline rounded-xl hover:bg-admin-warmbg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={couriers.length === 0}
                onClick={handleConfirmAssign}
                className="px-5 py-2.5 text-xs font-bold text-white bg-admin-primary hover:bg-admin-primary-hover disabled:bg-admin-textsecondary disabled:cursor-not-allowed rounded-xl transition-colors shadow-md shadow-admin-primary/20"
              >
                Konfirmasi Penugasan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Buat Akun Kurir Baru */}
      {isCourierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-admin-hairline">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-admin-textprimary">
                Buat Akun Kurir Baru
              </h3>
              <button
                onClick={() => setIsCourierModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-admin-textsecondary mb-6 leading-relaxed">
              Akun kurir ini memiliki hak istimewa khusus untuk menangani pengiriman barang di platform AgroWaste.
            </p>

            <form onSubmit={handleCreateCourier} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-admin-textprimary uppercase tracking-wider mb-1">
                  Nama Lengkap Kurir
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-admin-hairline text-xs focus:ring-2 focus:ring-admin-primary/20 focus:border-admin-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-admin-textprimary uppercase tracking-wider mb-1">
                  Alamat Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="kurir@agrowaste.id"
                  value={courierEmail}
                  onChange={(e) => setCourierEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-admin-hairline text-xs focus:ring-2 focus:ring-admin-primary/20 focus:border-admin-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-admin-textprimary uppercase tracking-wider mb-1">
                  Nomor WhatsApp / Telepon
                </label>
                <input
                  type="tel"
                  required
                  placeholder="081234567890"
                  value={courierPhone}
                  onChange={(e) => setCourierPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-admin-hairline text-xs focus:ring-2 focus:ring-admin-primary/20 focus:border-admin-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-admin-textprimary uppercase tracking-wider mb-1">
                  Kata Sandi (Password)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Minimal 8 karakter"
                  value={courierPassword}
                  onChange={(e) => setCourierPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-admin-hairline text-xs focus:ring-2 focus:ring-admin-primary/20 focus:border-admin-primary outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-admin-hairline/60">
                <button
                  type="button"
                  onClick={() => setIsCourierModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCourier}
                  className="px-5 py-2 bg-admin-primary text-white text-xs font-bold rounded-xl hover:bg-admin-primary/90 disabled:opacity-50"
                >
                  {isCreatingCourier ? "Membuat..." : "Buat Akun Kurir"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
