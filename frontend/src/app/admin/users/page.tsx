"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string | null;
  is_suspended: boolean | number;
  created_at: string;
  peternak_profile?: { nama_peternakan: string; badge?: string } | null;
}

function formatRole(role: string) {
  switch (role) {
    case "peternak":
      return {
        label: "Peternak",
        cls: "bg-admin-semamber/10 text-admin-semamber",
      };
    case "pembeli":
      return { label: "Pembeli", cls: "bg-blue-50 text-blue-600" };
    case "admin":
      return { label: "Admin", cls: "bg-purple-50 text-purple-600" };
    case "logistik":
      return { label: "Logistik", cls: "bg-orange-50 text-orange-600" };
    default:
      return { label: role, cls: "bg-admin-warmbg text-admin-textsecondary" };
  }
}

function statusInfo(isSuspended: boolean | number) {
  const suspended = !!isSuspended;
  return suspended
    ? {
        label: "Ditangguhkan",
        color: "bg-admin-semred",
        bg: "bg-admin-semred/10 text-admin-semred",
      }
    : {
        label: "Aktif",
        color: "bg-admin-semgreen",
        bg: "bg-admin-semgreen/10 text-admin-semgreen",
      };
}

function AdminUserManagementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlRole = searchParams.get("role") || "ALL";
  const urlSearch = searchParams.get("search") || "";

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("Semua Pengguna");
  const [search, setSearch] = useState("");
  const [suspendingId, setSuspendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);
  const [courierName, setCourierName] = useState("");
  const [courierEmail, setCourierEmail] = useState("");
  const [courierPhone, setCourierPhone] = useState("");
  const [courierPassword, setCourierPassword] = useState("");
  const [isCreatingCourier, setIsCreatingCourier] = useState(false);
  const [courierSuccess, setCourierSuccess] = useState<string | null>(null);

  const handleCreateCourier = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setCourierSuccess(null);
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
      if (!res.ok || !json.success) {
        setActionError(json.message || "Gagal membuat akun kurir.");
        setIsCreatingCourier(false);
        return;
      }

      setCourierSuccess("Akun Kurir berhasil dibuat!");
      setCourierName("");
      setCourierEmail("");
      setCourierPhone("");
      setCourierPassword("");
      setIsCourierModalOpen(false);
      fetchUsers();
    } catch {
      setActionError("Terjadi kesalahan koneksi saat membuat akun kurir.");
    } finally {
      setIsCreatingCourier(false);
    }
  };

  useEffect(() => {
    if (urlRole === "peternak") setActiveFilter("Peternak");
    else if (urlRole === "pembeli") setActiveFilter("Pembeli");
    else if (urlRole === "logistik") setActiveFilter("Logistik");
    else setActiveFilter("Semua Pengguna");

    setSearch(urlSearch);
  }, [urlRole, urlSearch]);

  const filterMap: Record<string, string> = {
    "Semua Pengguna": "ALL",
    Peternak: "peternak",
    Pembeli: "pembeli",
    Logistik: "logistik",
  };

  const fetchUsers = () => {
    setLoading(true);
    apiFetch("/admin/users")
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json) => {
        setUsers(json.data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleSuspend = async (user: User) => {
    setSuspendingId(user.id);
    setActionError(null);
    try {
      const res = await apiFetch(`/admin/users/${user.id}/suspend`, {
        method: "PUT",
      });
      if (res.ok) {
        fetchUsers();
      } else {
        setActionError("Gagal memperbarui status pengguna.");
      }
    } catch {
      setActionError("Terjadi kesalahan jaringan.");
    } finally {
      setSuspendingId(null);
    }
  };

  const visible = useMemo(() => {
    const roleFilter = filterMap[activeFilter];
    return users.filter((u) => {
      const matchRole = roleFilter === "ALL" || u.role === roleFilter;
      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      return matchRole && matchSearch;
    });
  }, [users, activeFilter, search]);

  const totalPeternakCount = useMemo(
    () => users.filter((u) => u.role === "peternak").length,
    [users],
  );
  const totalPembeliCount = useMemo(
    () => users.filter((u) => u.role === "pembeli").length,
    [users],
  );
  const totalLogistikCount = useMemo(
    () => users.filter((u) => u.role === "logistik").length,
    [users],
  );

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-admin-textprimary mb-1">
            Manajemen Pengguna
          </h2>
          <p className="text-sm text-admin-textsecondary">
            Kelola data seluruh pelaku ekosistem AgroWaste.
          </p>
        </div>
        <button
          onClick={() => setIsCourierModalOpen(true)}
          className="px-5 py-2.5 bg-admin-primary text-white text-xs font-bold rounded-xl hover:bg-admin-primary/90 transition-all shadow-sm flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Buat Akun Kurir
        </button>
      </div>

      {actionError && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-semibold flex justify-between items-center animate-fade-in">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="underline">
            Tutup
          </button>
        </div>
      )}

      {/* Row 1: KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-admin-surfacewhite border border-admin-hairline rounded-2xl p-6 group transition-colors hover:border-admin-primary/20">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-admin-primary-light text-admin-primary flex items-center justify-center group-hover:bg-admin-primary/20 transition-colors">
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>
          <span className="text-[10px] font-bold text-admin-textsecondary tracking-wider uppercase block mb-1">
            TOTAL PENGGUNA AKTIF
          </span>
          <div className="text-3xl font-bold font-tabular text-admin-textprimary">
            {loading ? "..." : users.length}
          </div>
        </div>
        <div className="bg-admin-surfacewhite border border-admin-hairline rounded-2xl p-6 group transition-colors hover:border-admin-primary/20">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-admin-semgreen/10 text-admin-semgreen flex items-center justify-center group-hover:bg-admin-semgreen/20 transition-colors">
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
                  d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z"
                />
              </svg>
            </div>
          </div>
          <span className="text-[10px] font-bold text-admin-textsecondary tracking-wider uppercase block mb-1">
            TOTAL PENJUAL (PETERNAK)
          </span>
          <div className="text-3xl font-bold font-tabular text-admin-textprimary">
            {loading ? "..." : totalPeternakCount}
          </div>
        </div>
        <div className="bg-admin-surfacewhite border border-admin-hairline rounded-2xl p-6 group transition-colors hover:border-admin-primary/20">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-admin-semamber/10 text-admin-semamber flex items-center justify-center group-hover:bg-admin-semamber/20 transition-colors">
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
                  d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                />
              </svg>
            </div>
          </div>
          <span className="text-[10px] font-bold text-admin-textsecondary tracking-wider uppercase block mb-1">
            MITRA LOGISTIK / KURIR
          </span>
          <div className="text-3xl font-bold font-tabular text-admin-textprimary">
            {loading ? "..." : totalLogistikCount}
          </div>
        </div>
      </div>

      {/* User Table Surface */}
      <div className="bg-admin-surfacewhite border border-admin-hairline rounded-2xl overflow-hidden">
        {/* Table Filter Controls */}
        <div className="p-6 border-b border-admin-hairline flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex bg-admin-warmbg p-1.5 rounded-xl gap-1 max-w-full overflow-x-auto w-full lg:w-auto">
            {Object.keys(filterMap).map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setActiveFilter(filter);
                  const roleCode = filterMap[filter];
                  const params = new URLSearchParams();
                  if (search.trim()) params.set("search", search.trim());
                  if (roleCode && roleCode !== "ALL") params.set("role", roleCode);
                  const queryStr = params.toString();
                  router.push(queryStr ? `/admin/users?${queryStr}` : "/admin/users");
                }}
                className={`px-4 py-2 font-bold rounded-lg text-xs transition-all ${
                  activeFilter === filter
                    ? "bg-admin-surfacewhite text-admin-primary shadow-sm"
                    : "text-admin-textsecondary hover:text-admin-textprimary"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-admin-textsecondary">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama atau email..."
                className="w-64 pl-9 pr-4 py-2 bg-admin-warmbg border border-admin-hairline rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-admin-primary"
              />
            </div>
          </div>
        </div>

        {/* Data Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-admin-hairline bg-[#F9F8F6] text-[10px] font-bold text-admin-textsecondary uppercase tracking-wider">
                <th className="px-6 py-4">Nama Lengkap / Akun</th>
                <th className="px-6 py-4">Peran</th>
                <th className="px-6 py-4">Status Akun</th>
                <th className="px-6 py-4">Bergabung Pada</th>
                <th className="px-6 py-4 text-right">Opsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-hairline">
              {loading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-admin-textsecondary text-sm animate-pulse"
                  >
                    Memuat data pengguna...
                  </td>
                </tr>
              )}
              {!loading && visible.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-admin-textsecondary text-sm"
                  >
                    Tidak ada pengguna yang ditemukan.
                  </td>
                </tr>
              )}
              {!loading &&
                visible.map((user) => {
                  const role = formatRole(user.role);
                  const status = statusInfo(user.is_suspended);
                  const joinedAt = new Date(user.created_at).toLocaleDateString(
                    "id-ID",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    },
                  );
                  const initials = user.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-admin-warmbg/40 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover border border-admin-hairline group-hover:border-admin-primary transition-colors"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full border border-admin-hairline bg-admin-primary-light text-admin-primary flex items-center justify-center font-bold group-hover:border-admin-primary transition-colors">
                              {initials}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-admin-textprimary group-hover:text-admin-primary transition-colors">
                              {user.name}
                            </div>
                            <span className="text-xs text-admin-textsecondary font-tabular">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider ${role.cls}`}
                        >
                          {role.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${status.bg}`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${status.color}`}
                          ></span>{" "}
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-admin-textsecondary font-tabular font-medium">
                        {joinedAt}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleToggleSuspend(user)}
                          disabled={suspendingId === user.id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            user.is_suspended
                              ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                              : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                          }`}
                        >
                          {suspendingId === user.id
                            ? "..."
                            : user.is_suspended
                              ? "Aktifkan"
                              : "Suspend"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-6 border-t border-admin-hairline bg-admin-surfacewhite flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-admin-textsecondary font-medium font-tabular">
            Menampilkan{" "}
            <span className="text-admin-textprimary font-bold">
              {visible.length}
            </span>{" "}
            dari{" "}
            <span className="text-admin-textprimary font-bold">
              {users.length}
            </span>{" "}
            pengguna
          </span>
        </div>
      </div>

      {/* Modal Buat Akun Kurir */}
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
    </div>
  );
}

export default function AdminUserManagement() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-admin-semgreen">Memuat data pengguna...</div>}>
      <AdminUserManagementContent />
    </Suspense>
  );
}
