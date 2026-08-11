"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, getProductImageUrl } from "@/lib/api";
import { getToken, logout, saveAuth } from "@/lib/auth";
import {
  User as UserIcon,
  MapPin,
  Award,
  FileText,
  Check,
  X,
  Edit2,
  LogOut,
  Leaf,
  AlertCircle,
} from "lucide-react";
import TwoFactorModal from "@/components/common/TwoFactorModal";

interface ProfileResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
    role: string;
    peternak_profile?: {
      nama_peternakan: string;
      deskripsi: string | null;
      provinsi: string;
      kabupaten: string;
      kecamatan: string;
      jenis_ternak: string[] | string;
      kapasitas_ternak: number | string | null;
      total_sold_kg: number | string;
    };
    buyer_profile?: {
      nama_instansi: string | null;
      tipe_pembeli: string;
      provinsi: string;
      kabupaten: string;
    };
    logistik_profile?: {
      company_name: string;
      vehicle_plate: string;
    };
  };
}

export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(
    null,
  );

  const [user, setUser] = useState<ProfileResponse["data"] | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // buyer fields
  const [tipePembeli, setTipePembeli] = useState("individu");
  const [namaInstansi, setNamaInstansi] = useState("");
  const [buyerProvinsi, setBuyerProvinsi] = useState("");
  const [buyerKabupaten, setBuyerKabupaten] = useState("");

  // seller fields
  const [namaPeternakan, setNamaPeternakan] = useState("");
  const [jenisTernak, setJenisTernak] = useState<string[]>([]);
  const [kapasitasTernak, setKapasitasTernak] = useState<number | string>("");
  const [farmDeskripsi, setFarmDeskripsi] = useState("");
  const [farmProvinsi, setFarmProvinsi] = useState("");
  const [farmKabupaten, setFarmKabupaten] = useState("");
  const [farmKecamatan, setFarmKecamatan] = useState("");

  // logistics fields
  const [companyName, setCompanyName] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");

  const [pupukQuantity, setPupukQuantity] = useState(0);
  const [emisiQuantity, setEmisiQuantity] = useState(0);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login?callbackUrl=/profile");
      return;
    }

    apiFetch("/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((json: ProfileResponse | null) => {
        if (json?.success && json?.data) {
          const u = json.data;
          setUser(u);
          setName(u.name || "");
          setEmail(u.email || "");
          setPhone(u.phone || "");

          if (u.role === "pembeli" && u.buyer_profile) {
            setTipePembeli(u.buyer_profile.tipe_pembeli || "individu");
            setNamaInstansi(u.buyer_profile.nama_instansi || "");
            setBuyerProvinsi(u.buyer_profile.provinsi || "");
            setBuyerKabupaten(u.buyer_profile.kabupaten || "");
            fetchBuyerImpact();
          } else if (u.role === "peternak" && u.peternak_profile) {
            setNamaPeternakan(u.peternak_profile.nama_peternakan || "");
            setFarmDeskripsi(u.peternak_profile.deskripsi || "");
            setFarmProvinsi(u.peternak_profile.provinsi || "");
            setFarmKabupaten(u.peternak_profile.kabupaten || "");
            setFarmKecamatan(u.peternak_profile.kecamatan || "");
            setKapasitasTernak(u.peternak_profile.kapasitas_ternak || "");

            // jenis_ternak may be a JSON string or a plain array
            let jt: string[] = [];
            try {
              if (typeof u.peternak_profile.jenis_ternak === "string") {
                jt = JSON.parse(u.peternak_profile.jenis_ternak);
              } else if (Array.isArray(u.peternak_profile.jenis_ternak)) {
                jt = u.peternak_profile.jenis_ternak;
              }
            } catch {
              jt = [];
            }
            setJenisTernak(jt);

            const soldKg = Number(u.peternak_profile.total_sold_kg || 0);
            setPupukQuantity(soldKg);
            setEmisiQuantity(soldKg * 0.98);
          } else if (u.role === "logistik" && u.logistik_profile) {
            setCompanyName(u.logistik_profile.company_name || "");
            setVehiclePlate(u.logistik_profile.vehicle_plate || "");
            fetchLogistikImpact();
          } else if (u.role === "admin") {
            fetchAdminImpact();
          }
        } else {
          setErrorMsg("Gagal memuat profil.");
        }
      })
      .catch(() => {
        setErrorMsg("Tidak dapat terhubung ke server.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  const fetchBuyerImpact = () => {
    interface BuyerOrder {
      status: string;
      quantity_kg: string | number;
    }
    apiFetch("/orders")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.success && json?.data) {
          const completedOrders = (json.data as BuyerOrder[]).filter(
            (o) => o.status === "selesai",
          );
          const totalKg = completedOrders.reduce(
            (acc, o) => acc + Number(o.quantity_kg || 0),
            0,
          );
          setPupukQuantity(totalKg);
          setEmisiQuantity(totalKg * 0.98);
        }
      })
      .catch(() => {});
  };

  const fetchLogistikImpact = () => {
    interface LogistikShipment {
      status: string;
      order?: {
        quantity_kg: string | number;
      };
    }
    apiFetch("/logistik/shipments")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.success && json?.data) {
          const completedShipments = (json.data as LogistikShipment[]).filter(
            (s) => s.status === "terkirim",
          );
          const totalKg = completedShipments.reduce(
            (acc, s) => acc + Number(s.order?.quantity_kg || 0),
            0,
          );
          setPupukQuantity(totalKg);
          setEmisiQuantity(totalKg * 0.98);
        }
      })
      .catch(() => {});
  };

  const fetchAdminImpact = () => {
    apiFetch("/dashboard/impact")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.success && json?.data) {
          setPupukQuantity(Number(json.data.total_waste_managed_kg || 0));
          setEmisiQuantity(Number(json.data.total_co2eq_reduced_kg || 0));
        }
      })
      .catch(() => {});
  };

  const handleCheckboxChange = (animal: string) => {
    if (jenisTernak.includes(animal)) {
      setJenisTernak(jenisTernak.filter((a) => a !== animal));
    } else {
      setJenisTernak([...jenisTernak, animal]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const body: Record<string, string | number | string[] | null> = {
      name,
      phone,
    };

    if (user?.role === "pembeli") {
      body.tipe_pembeli = tipePembeli;
      body.nama_instansi = tipePembeli === "instansi" ? namaInstansi : null;
      body.provinsi = buyerProvinsi;
      body.kabupaten = buyerKabupaten;
    } else if (user?.role === "peternak") {
      body.nama_peternakan = namaPeternakan;
      body.deskripsi = farmDeskripsi;
      body.provinsi = farmProvinsi;
      body.kabupaten = farmKabupaten;
      body.kecamatan = farmKecamatan;
      body.kapasitas_ternak =
        kapasitasTernak !== "" ? Number(kapasitasTernak) : null;
      body.jenis_ternak = jenisTernak;
    } else if (user?.role === "logistik") {
      body.company_name = companyName;
      body.vehicle_plate = vehiclePlate;
    }

    try {
      const res = await apiFetch("/profile", {
        method: "PUT",
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        setSuccessMsg("Profil Anda berhasil diperbarui!");
        setIsEditing(false);
        setUser(json.data);

        const token = getToken();
        if (token && json.data) {
          saveAuth(token, {
            id: json.data.id,
            name: json.data.name,
            email: json.data.email,
            role: json.data.role,
            avatar_url: json.data.avatar_url,
          });
        }

        window.dispatchEvent(new Event("auth-change"));
      } else {
        setErrorMsg(json.message || "Gagal memperbarui profil.");
      }
    } catch {
      setErrorMsg("Tidak dapat terhubung ke server untuk menyimpan perubahan.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran berkas maksimal 2MB.");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await apiFetch("/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessMsg("Foto profil berhasil diperbarui!");
        setUser(json.data);

        // Sync local storage
        const token = getToken();
        if (token && json.data) {
          saveAuth(token, {
            id: json.data.id,
            name: json.data.name,
            email: json.data.email,
            role: json.data.role,
            avatar_url: json.data.avatar_url,
          });
        }

        window.dispatchEvent(new Event("auth-change"));
      } else {
        setErrorMsg(json.message || "Gagal mengunggah foto profil.");
      }
    } catch {
      setErrorMsg("Tidak dapat terhubung ke server untuk mengunggah foto.");
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "admin":
        return "Administrator";
      case "peternak":
        return "Peternak Terverifikasi";
      case "logistik":
        return "Mitra Kurir Terverifikasi";
      case "pembeli":
      default:
        return "Pembeli Terverifikasi";
    }
  };

  const getRoleBadgeStyles = (role?: string) => {
    switch (role) {
      case "admin":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "peternak":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "logistik":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-[#009A44]/20 text-[#4ADE80] border-[#009A44]/30";
    }
  };

  const getLocationText = () => {
    if (user?.role === "pembeli" && user.buyer_profile) {
      return (
        `${user.buyer_profile.kabupaten || ""}, ${user.buyer_profile.provinsi || ""}`
          .trim()
          .replace(/^,\s*|,\s*$/g, "") || "Lokasi belum diatur"
      );
    }
    if (user?.role === "peternak" && user.peternak_profile) {
      return (
        `${user.peternak_profile.kecamatan || ""}, ${user.peternak_profile.kabupaten || ""}, ${user.peternak_profile.provinsi || ""}`
          .trim()
          .replace(/^,\s*|,\s*$/g, "") || "Lokasi belum diatur"
      );
    }
    return "Indonesia";
  };

  const handleLogout = () => {
    logout();
    window.dispatchEvent(new Event("auth-change"));
    window.location.href = "/";
  };

  /* ── 1. LOADING SKELETON STATE ── */
  if (loading) {
    return (
      <div className="flex-1 bg-[#FFF8F5] pb-20">
        <div className="bg-[#1C1A18] pt-28 pb-16 px-6 relative overflow-hidden">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center md:items-end gap-6 relative z-10 animate-pulse">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-neutral-800 border-4 border-neutral-700 shrink-0"></div>
            <div className="flex-1 text-center md:text-left space-y-3">
              <div className="h-5 bg-neutral-800 rounded-full w-32 mx-auto md:mx-0"></div>
              <div className="h-8 bg-neutral-800 rounded w-48 mx-auto md:mx-0"></div>
              <div className="h-4 bg-neutral-800 rounded w-36 mx-auto md:mx-0"></div>
            </div>
            <div className="h-10 bg-neutral-800 rounded-xl w-28"></div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-6 -mt-8 relative z-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <div className="bg-white rounded-3xl border border-[#E8E0D5] p-6 space-y-4 shadow-sm">
                <div className="h-10 bg-neutral-100 rounded-2xl w-full animate-pulse"></div>
                <div className="h-10 bg-neutral-100 rounded-2xl w-full animate-pulse"></div>
                <div className="h-10 bg-neutral-100 rounded-2xl w-full animate-pulse"></div>
              </div>
            </div>
            <div className="md:col-span-2 space-y-6">
              <div className="bg-[#009A44] rounded-3xl p-6 h-36 animate-pulse"></div>
              <div className="bg-white border border-[#E8E0D5] rounded-3xl p-8 h-80 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── 2. MAIN PROFILE CONTENT ── */
  return (
    <div className="flex-1 animate-fade-in bg-[#FFF8F5] pb-20">
      {/* Profile Header */}
      <div className="bg-[#1C1A18] pt-28 pb-16 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#009A44] rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/3"></div>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center md:items-end gap-6 relative z-10">
          <div className="relative group w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-[#FFF8F5] bg-gray-200 overflow-hidden shrink-0 shadow-xl flex items-center justify-center">
            {user?.avatar_url ? (
              <img
                src={getProductImageUrl(user.avatar_url)}
                alt="Foto Pengguna"
                className="w-full h-full object-cover animate-fade-in"
              />
            ) : (
              <div className="w-full h-full bg-[#009A44]/10 text-[#009A44] flex items-center justify-center font-bold text-4xl md:text-5xl">
                <span>
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </span>
              </div>
            )}

            {/* Overlay to change/add photo */}
            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] md:text-xs font-bold cursor-pointer transition-opacity duration-200">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <Edit2 className="w-4 h-4 md:w-6 md:h-6 mb-1" />
              Ganti Foto
            </label>
          </div>

          <div className="flex-1 text-center md:text-left">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-3 border ${getRoleBadgeStyles(user?.role)}`}
            >
              <Award className="w-3.5 h-3.5" />
              {getRoleBadge(user?.role)}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {user?.name}
            </h1>
            <p className="text-sm text-gray-400 flex items-center justify-center md:justify-start gap-2">
              <MapPin className="w-4 h-4 text-[#009A44]" />
              {getLocationText()}
            </p>
          </div>

          {!isEditing ? (
            <button
              onClick={() => {
                setIsEditing(true);
                setSuccessMsg(null);
                setErrorMsg(null);
              }}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-xl border border-white/20 transition-colors backdrop-blur-sm flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profil
            </button>
          ) : (
            <button
              onClick={() => {
                setIsEditing(false);
                setErrorMsg(null);
              }}
              className="px-6 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm font-bold rounded-xl border border-red-500/30 transition-colors backdrop-blur-sm flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Batal
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-8 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Sidebar Nav */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl border border-[#E8E0D5] p-2 shadow-sm overflow-hidden">
              <div className="space-y-1">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#E6F5EC] text-[#009A44] font-bold text-sm text-left transition-colors">
                  <UserIcon className="w-5 h-5" />
                  Informasi Akun
                </button>
                <Link
                  href="/pesanan"
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[#555555] hover:bg-[#F9F9F9] hover:text-[#111111] font-bold text-sm text-left transition-colors"
                >
                  <FileText className="w-5 h-5" />
                  Riwayat Pesanan
                </Link>
                <Link
                  href="/impact"
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[#555555] hover:bg-[#F9F9F9] hover:text-[#111111] font-bold text-sm text-left transition-colors"
                >
                  <Leaf className="w-5 h-5" />
                  Dampak Lingkungan
                </Link>
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 font-bold text-sm text-left transition-colors mt-4"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5" />
                  Keluar
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Impact Mini Dashboard */}
            <div className="bg-[#009A44] rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
              <div className="absolute -right-10 -top-10 opacity-10">
                <Leaf className="w-40 h-40" />
              </div>
              <h2 className="font-bold text-lg mb-4 relative z-10">
                {user?.role === "pembeli" && "Kontribusi Anda Sejauh Ini"}
                {user?.role === "peternak" && "Kontribusi Penjualan Anda"}
                {user?.role === "logistik" && "Kontribusi Pengiriman Anda"}
                {user?.role === "admin" && "Statistik Transaksi Global"}
              </h2>
              <div className="grid grid-cols-2 gap-4 relative z-10">
                <div className="bg-black/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                  <div className="text-[10px] font-bold tracking-widest uppercase text-[#E6F5EC] mb-1">
                    {user?.role === "pembeli" && "Pupuk Dibeli"}
                    {user?.role === "peternak" && "Pupuk Terjual"}
                    {user?.role === "logistik" && "Pupuk Diantar"}
                    {user?.role === "admin" && "Total Limbah Diolah"}
                  </div>
                  <div className="text-2xl font-bold font-tabular">
                    {pupukQuantity.toLocaleString("id-ID")}{" "}
                    <span className="text-sm font-normal">kg</span>
                  </div>
                </div>
                <div className="bg-black/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                  <div className="text-[10px] font-bold tracking-widest uppercase text-[#E6F5EC] mb-1">
                    Emisi Ditekan
                  </div>
                  <div className="text-2xl font-bold font-tabular">
                    {emisiQuantity.toLocaleString("id-ID", {
                      maximumFractionDigits: 1,
                    })}{" "}
                    <span className="text-sm font-normal">kg CO₂</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Toast Banners */}
            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-fade-in">
                <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-5 py-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-fade-in">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Personal Information Form */}
            <div className="bg-white border border-[#E8E0D5] rounded-3xl p-8 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-[#111111]">
                  Informasi Pribadi
                </h2>
              </div>

              <form onSubmit={handleSave} className="space-y-5">
                {/* ── SECTION: COMMON FIELDS ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-[#555555] tracking-wider uppercase mb-2">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      required
                      readOnly={!isEditing}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full bg-[#F9F9F9] border rounded-xl px-4 py-3 text-sm font-bold text-[#111111] focus:outline-none transition-colors ${
                        isEditing
                          ? "border-[#A27B5C] bg-white focus:ring-1 focus:ring-[#A27B5C]"
                          : "border-[#E8E0D5] cursor-not-allowed"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#555555] tracking-wider uppercase mb-2">
                      Nomor HP
                    </label>
                    <input
                      type="text"
                      required
                      readOnly={!isEditing}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`w-full bg-[#F9F9F9] border rounded-xl px-4 py-3 text-sm font-bold text-[#111111] focus:outline-none transition-colors ${
                        isEditing
                          ? "border-[#A27B5C] bg-white focus:ring-1 focus:ring-[#A27B5C]"
                          : "border-[#E8E0D5] cursor-not-allowed"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#555555] tracking-wider uppercase mb-2">
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    disabled
                    readOnly
                    value={email}
                    className="w-full bg-[#F9F9F9] border border-[#E8E0D5] rounded-xl px-4 py-3 text-sm font-bold text-gray-500 cursor-not-allowed focus:outline-none"
                  />
                  {isEditing && (
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      Email tidak dapat diubah karena merupakan tanda pengenal
                      akun Anda.
                    </span>
                  )}
                </div>

                {/* ── SECTION: BUYER ROLE FIELDS ── */}
                {user?.role === "pembeli" && (
                  <div className="space-y-5 pt-3 border-t border-dashed border-[#E8E0D5]">
                    <h3 className="text-xs font-bold text-emerald-700 tracking-widest uppercase">
                      Detail Akun Pembeli
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-[#555555] tracking-wider uppercase mb-2">
                          Tipe Pembeli
                        </label>
                        {isEditing ? (
                          <select
                            value={tipePembeli}
                            onChange={(e) => setTipePembeli(e.target.value)}
                            className="w-full bg-white border border-[#A27B5C] rounded-xl px-4 py-3 text-sm font-bold text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#A27B5C]"
                          >
                            <option value="individu">
                              Individu / Petani Mandiri
                            </option>
                            <option value="instansi">
                              Instansi / Kelompok Tani / Perusahaan
                            </option>
                          </select>
                        ) : (
                          <input
                            type="text"
                            readOnly
                            value={
                              tipePembeli === "instansi"
                                ? "Kelompok Tani / Instansi"
                                : "Individu / Petani Mandiri"
                            }
                            className="w-full bg-[#F9F9F9] border border-[#E8E0D5] rounded-xl px-4 py-3 text-sm font-bold text-[#111111] cursor-not-allowed"
                          />
                        )}
                      </div>

                      {tipePembeli === "instansi" && (
                        <div>
                          <label className="block text-xs font-bold text-[#555555] tracking-wider uppercase mb-2">
                            Nama Instansi / Perusahaan
                          </label>
                          <input
                            type="text"
                            required={tipePembeli === "instansi"}
                            readOnly={!isEditing}
                            value={namaInstansi}
                            onChange={(e) => setNamaInstansi(e.target.value)}
                            placeholder="Contoh: Koperasi Tani Makmur"
                            className={`w-full bg-[#F9F9F9] border rounded-xl px-4 py-3 text-sm font-bold text-[#111111] focus:outline-none transition-colors ${
                              isEditing
                                ? "border-[#A27B5C] bg-white focus:ring-1 focus:ring-[#A27B5C]"
                                : "border-[#E8E0D5] cursor-not-allowed"
                            }`}
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-[#555555] tracking-wider uppercase mb-2">
                          Provinsi
                        </label>
                        <input
                          type="text"
                          required
                          readOnly={!isEditing}
                          value={buyerProvinsi}
                          onChange={(e) => setBuyerProvinsi(e.target.value)}
                          placeholder="Jawa Barat, Jawa Timur, dll."
                          className={`w-full bg-[#F9F9F9] border rounded-xl px-4 py-3 text-sm font-bold text-[#111111] focus:outline-none transition-colors ${
                            isEditing
                              ? "border-[#A27B5C] bg-white focus:ring-1 focus:ring-[#A27B5C]"
                              : "border-[#E8E0D5] cursor-not-allowed"
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#555555] tracking-wider uppercase mb-2">
                          Kota / Kabupaten
                        </label>
                        <input
                          type="text"
                          required
                          readOnly={!isEditing}
                          value={buyerKabupaten}
                          onChange={(e) => setBuyerKabupaten(e.target.value)}
                          placeholder="Kabupaten Bandung Barat, Kota Malang, dll."
                          className={`w-full bg-[#F9F9F9] border rounded-xl px-4 py-3 text-sm font-bold text-[#111111] focus:outline-none transition-colors ${
                            isEditing
                              ? "border-[#A27B5C] bg-white focus:ring-1 focus:ring-[#A27B5C]"
                              : "border-[#E8E0D5] cursor-not-allowed"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── SECTION: SELLER ROLE FIELDS ── */}
                {user?.role === "peternak" && (
                  <div className="space-y-5 pt-3 border-t border-dashed border-[#E8E0D5]">
                    <h3 className="text-xs font-bold text-emerald-700 tracking-widest uppercase">
                      Detail Peternakan
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-[#555555] tracking-wider uppercase mb-2">
                          Nama Peternakan
                        </label>
                        <input
                          type="text"
                          required
                          readOnly={!isEditing}
                          value={namaPeternakan}
                          onChange={(e) => setNamaPeternakan(e.target.value)}
                          placeholder="Nama Peternakan Anda"
                          className={`w-full bg-[#F9F9F9] border rounded-xl px-4 py-3 text-sm font-bold text-[#111111] focus:outline-none transition-colors ${
                            isEditing
                              ? "border-[#A27B5C] bg-white focus:ring-1 focus:ring-[#A27B5C]"
                              : "border-[#E8E0D5] cursor-not-allowed"
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#555555] tracking-wider uppercase mb-2">
                          Kapasitas Ternak (Ekor)
                        </label>
                        <input
                          type="number"
                          readOnly={!isEditing}
                          value={kapasitasTernak}
                          onChange={(e) => setKapasitasTernak(e.target.value)}
                          placeholder="Jumlah ternak aktif"
                          className={`w-full bg-[#F9F9F9] border rounded-xl px-4 py-3 text-sm font-bold text-[#111111] focus:outline-none transition-colors ${
                            isEditing
                              ? "border-[#A27B5C] bg-white focus:ring-1 focus:ring-[#A27B5C]"
                              : "border-[#E8E0D5] cursor-not-allowed"
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#555555] tracking-wider uppercase mb-2">
                        Jenis Hewan Ternak
                      </label>
                      <div className="flex flex-wrap gap-2.5 mt-1">
                        {[
                          "sapi",
                          "ayam",
                          "kambing",
                          "domba",
                          "kuda",
                          "babi",
                          "lainnya",
                        ].map((animal) => {
                          const isSelected = jenisTernak.includes(animal);
                          if (isEditing) {
                            return (
                              <button
                                key={animal}
                                type="button"
                                onClick={() => handleCheckboxChange(animal)}
                                className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                                  isSelected
                                    ? "bg-[#009A44]/15 border-[#009A44] text-[#009A44]"
                                    : "bg-white border-[#E8E0D5] text-gray-600 hover:bg-gray-50"
                                }`}
                              >
                                {animal.charAt(0).toUpperCase() +
                                  animal.slice(1)}
                              </button>
                            );
                          } else {
                            return isSelected ? (
                              <span
                                key={animal}
                                className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-gray-100 border border-gray-200 text-gray-700 capitalize"
                              >
                                {animal}
                              </span>
                            ) : null;
                          }
                        })}
                        {!isEditing && jenisTernak.length === 0 && (
                          <span className="text-sm font-semibold text-gray-400">
                            Belum ada jenis ternak yang dipilih.
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#555555] tracking-wider uppercase mb-2">
                        Deskripsi Peternakan
                      </label>
                      <textarea
                        readOnly={!isEditing}
                        value={farmDeskripsi}
                        onChange={(e) => setFarmDeskripsi(e.target.value)}
                        placeholder="Tuliskan info singkat peternakan dan ketersediaan limbah..."
                        className={`w-full bg-[#F9F9F9] border rounded-xl px-4 py-3 text-sm font-semibold text-[#555555] focus:outline-none transition-colors resize-none h-24 ${
                          isEditing
                            ? "border-[#A27B5C] bg-white focus:ring-1 focus:ring-[#A27B5C]"
                            : "border-[#E8E0D5] cursor-not-allowed"
                        }`}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-[#555555] tracking-wider uppercase mb-2">
                          Provinsi
                        </label>
                        <input
                          type="text"
                          required
                          readOnly={!isEditing}
                          value={farmProvinsi}
                          onChange={(e) => setFarmProvinsi(e.target.value)}
                          className={`w-full bg-[#F9F9F9] border rounded-xl px-4 py-3 text-sm font-bold text-[#111111] focus:outline-none transition-colors ${
                            isEditing
                              ? "border-[#A27B5C] bg-white focus:ring-1 focus:ring-[#A27B5C]"
                              : "border-[#E8E0D5] cursor-not-allowed"
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#555555] tracking-wider uppercase mb-2">
                          Kabupaten
                        </label>
                        <input
                          type="text"
                          required
                          readOnly={!isEditing}
                          value={farmKabupaten}
                          onChange={(e) => setFarmKabupaten(e.target.value)}
                          className={`w-full bg-[#F9F9F9] border rounded-xl px-4 py-3 text-sm font-bold text-[#111111] focus:outline-none transition-colors ${
                            isEditing
                              ? "border-[#A27B5C] bg-white focus:ring-1 focus:ring-[#A27B5C]"
                              : "border-[#E8E0D5] cursor-not-allowed"
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#555555] tracking-wider uppercase mb-2">
                          Kecamatan
                        </label>
                        <input
                          type="text"
                          required
                          readOnly={!isEditing}
                          value={farmKecamatan}
                          onChange={(e) => setFarmKecamatan(e.target.value)}
                          className={`w-full bg-[#F9F9F9] border rounded-xl px-4 py-3 text-sm font-bold text-[#111111] focus:outline-none transition-colors ${
                            isEditing
                              ? "border-[#A27B5C] bg-white focus:ring-1 focus:ring-[#A27B5C]"
                              : "border-[#E8E0D5] cursor-not-allowed"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── SECTION: LOGISTIK / COURIER ROLE FIELDS ── */}
                {user?.role === "logistik" && (
                  <div className="space-y-5 pt-3 border-t border-dashed border-[#E8E0D5]">
                    <h3 className="text-xs font-bold text-emerald-700 tracking-widest uppercase">
                      Info Kendaraan & Logistik
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-[#555555] tracking-wider uppercase mb-2">
                          Perusahaan Logistik
                        </label>
                        <input
                          type="text"
                          required
                          readOnly={!isEditing}
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="Perusahaan kurir / logistik mandiri"
                          className={`w-full bg-[#F9F9F9] border rounded-xl px-4 py-3 text-sm font-bold text-[#111111] focus:outline-none transition-colors ${
                            isEditing
                              ? "border-[#A27B5C] bg-white focus:ring-1 focus:ring-[#A27B5C]"
                              : "border-[#E8E0D5] cursor-not-allowed"
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#555555] tracking-wider uppercase mb-2">
                          Nomor Plat Kendaraan
                        </label>
                        <input
                          type="text"
                          required
                          readOnly={!isEditing}
                          value={vehiclePlate}
                          onChange={(e) => setVehiclePlate(e.target.value)}
                          placeholder="Contoh: N 1234 AB"
                          className={`w-full bg-[#F9F9F9] border rounded-xl px-4 py-3 text-sm font-bold text-[#111111] focus:outline-none transition-colors ${
                            isEditing
                              ? "border-[#A27B5C] bg-white focus:ring-1 focus:ring-[#A27B5C]"
                              : "border-[#E8E0D5] cursor-not-allowed"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── SUBMIT BUTTONS (ONLY SHOW IN EDITING MODE) ── */}
                {isEditing && (
                  <div className="flex justify-end gap-3 pt-6 border-t border-dashed border-[#E8E0D5]">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="px-5 py-3 border border-[#E8E0D5] hover:bg-[#F9F9F9] text-gray-700 text-sm font-bold rounded-xl transition-all"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-3 bg-[#009A44] hover:bg-emerald-700 disabled:bg-emerald-800 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <svg
                            className="animate-spin h-4 w-4 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Simpan Perubahan
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* ── SECURITY & 2FA CARD ── */}
            <div className="bg-white border border-[#E8E0D5] rounded-3xl p-8 shadow-sm space-y-6">
              <div className="border-b border-[#E8E0D5] pb-4">
                <h2 className="text-xl font-bold text-[#111111]">
                  Keamanan Akun & 2FA
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Kelola kata sandi dan proteksi ganda akun Anda.
                </p>
              </div>

              {passwordSuccessMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{passwordSuccessMsg}</span>
                </div>
              )}

              {/* Ubah Kata Sandi */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setPasswordSuccessMsg("Kata sandi berhasil diperbarui!");
                  (e.target as HTMLFormElement).reset();
                  setTimeout(() => setPasswordSuccessMsg(null), 3000);
                }}
                className="space-y-4"
              >
                <h3 className="text-xs font-bold text-[#555555] tracking-wider uppercase">
                  Ubah Kata Sandi
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Kata Sandi Sekarang
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      className="w-full bg-[#F9F9F9] border border-[#E8E0D5] rounded-xl px-4 py-2.5 text-sm font-bold text-[#111111] focus:outline-none focus:border-[#009A44] focus:ring-1 focus:ring-[#009A44]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Kata Sandi Baru
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      className="w-full bg-[#F9F9F9] border border-[#E8E0D5] rounded-xl px-4 py-2.5 text-sm font-bold text-[#111111] focus:outline-none focus:border-[#009A44] focus:ring-1 focus:ring-[#009A44]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Ulangi Sandi Baru
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      className="w-full bg-[#F9F9F9] border border-[#E8E0D5] rounded-xl px-4 py-2.5 text-sm font-bold text-[#111111] focus:outline-none focus:border-[#009A44] focus:ring-1 focus:ring-[#009A44]"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#009A44] hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                  >
                    Perbarui Kata Sandi
                  </button>
                </div>
              </form>

              {/* 2FA Toggle */}
              <div className="pt-6 border-t border-dashed border-[#E8E0D5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-[#111111] flex items-center gap-2 mb-1">
                    Autentikasi Dua Langkah (2FA)
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md font-tabular uppercase tracking-wider ${is2FAEnabled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {is2FAEnabled ? "AKTIF" : "NONAKTIF"}
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500">
                    Minta kode verifikasi tambahan setiap kali Anda masuk ke
                    akun.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (is2FAEnabled) {
                      setIs2FAEnabled(false);
                    } else {
                      setIs2FAModalOpen(true);
                    }
                  }}
                  className="px-4 py-2 bg-[#F9F9F9] hover:bg-gray-100 border border-[#E8E0D5] text-[#111111] font-bold text-xs rounded-xl transition-all shrink-0"
                >
                  {is2FAEnabled ? "Nonaktifkan 2FA" : "Aktifkan 2FA (Scan QR)"}
                </button>
              </div>
            </div>

            {/* 2FA Google Authenticator Modal */}
            <TwoFactorModal
              isOpen={is2FAModalOpen}
              userEmail={user?.email || "pengguna@agrowaste.id"}
              userName={user?.name || "Pengguna AgroWaste"}
              onClose={() => setIs2FAModalOpen(false)}
              onSuccess={() => {
                setIs2FAEnabled(true);
                setPasswordSuccessMsg(
                  "2FA Google Authenticator berhasil diaktifkan dengan aman!",
                );
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
