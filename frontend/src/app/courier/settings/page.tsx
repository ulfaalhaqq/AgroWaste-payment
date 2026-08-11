"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import { saveAuth, getToken } from "@/lib/auth";
import { calculateDeliveryCost } from "@/lib/location";

const MotorIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="5.5" cy="17.5" r="2.5" />
    <circle cx="18.5" cy="17.5" r="2.5" />
    <path d="M15 6h4l2 5v6.5h-2.5" />
    <path d="M8 17.5h8" />
    <path d="M12 6h-4l-3.5 6.5v5" />
    <path d="M12 6v5.5h3.5" />
  </svg>
);

const TruckIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="1" y="3" width="15" height="13" rx="2" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

function CustomVehicleDropdown({
  value,
  onChange,
}: {
  value: "Motor" | "Mobil Pick-up";
  onChange: (val: "Motor" | "Mobil Pick-up") => void;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options: Array<{
    id: "Motor" | "Mobil Pick-up";
    label: string;
    sublabel: string;
    IconComponent: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: "Motor",
      label: "Motor (Kurir Instan)",
      sublabel: "Maks 25 kg • Rp 7k + Rp 2k/km",
      IconComponent: MotorIcon,
    },
    {
      id: "Mobil Pick-up",
      label: "Mobil Pick-up (Armada Kargo)",
      sublabel: "Maks 700 kg/mobil • Rp 25k + Rp 3.5k/km",
      IconComponent: TruckIcon,
    },
  ];

  const selected = options.find((o) => o.id === value) || options[1];
  const SelectedIcon = selected.IconComponent;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-2 bg-white border border-courier-hairline hover:border-courier-primary/40 rounded-xl flex items-center justify-between shadow-sm hover:shadow transition-all group cursor-pointer"
      >
        <div className="flex items-center gap-3 text-left truncate">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center shrink-0">
            <SelectedIcon className="w-4 h-4" />
          </div>
          <div className="truncate">
            <span className="text-xs font-bold text-courier-textprimary block leading-tight">
              {selected.label}
            </span>
            <span className="text-[10px] text-courier-textsecondary font-medium block">
              {selected.sublabel}
            </span>
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-courier-textsecondary transition-transform duration-200 shrink-0 ml-2 ${
            open ? "rotate-180 text-courier-primary" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-courier-hairline rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in p-1.5 space-y-1">
          {options.map((opt) => {
            const isSelected = opt.id === value;
            const ItemIcon = opt.IconComponent;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-emerald-50/70 border border-emerald-200/60"
                    : "hover:bg-gray-50 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <ItemIcon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <span
                      className={`text-xs font-bold block ${
                        isSelected
                          ? "text-emerald-900"
                          : "text-courier-textprimary"
                      }`}
                    >
                      {opt.label}
                    </span>
                    <span className="text-[10px] text-courier-textsecondary font-medium block">
                      {opt.sublabel}
                    </span>
                  </div>
                </div>
                {isSelected && (
                  <svg
                    className="w-4 h-4 text-emerald-600 shrink-0 ml-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface ProfileResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
    role: string;
    logistik_profile?: {
      company_name: string | null;
      vehicle_plate: string | null;
      vehicle_type?: string | null;
      lat?: number | string | null;
      lng?: number | string | null;
      alamat_posisi?: string | null;
      kecamatan?: string | null;
      kabupaten?: string | null;
      provinsi?: string | null;
    };
  };
}

export default function CourierSettings() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profil");
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [vehicleType, setVehicleType] = useState<"Motor" | "Mobil Pick-up">(
    "Mobil Pick-up",
  );
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");
  const [alamatPosisi, setAlamatPosisi] = useState("");
  const [kecamatan, setKecamatan] = useState("");
  const [kabupaten, setKabupaten] = useState("");
  const [provinsi, setProvinsi] = useState("");
  const [isDetectingGps, setIsDetectingGps] = useState(false);

  const handleAvatarUpload = async (file: File) => {
    setAvatarUploading(true);
    const formData = new FormData();
    formData.append("avatar", file);
    try {
      const token = getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000"}/profile/avatar`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        }
      );
      const json = await res.json();
      if (res.ok && json.success) {
        setAvatarUrl(json.data?.avatar_url ?? "");
      }
    } catch {
      // silent fail
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung Geolocation.");
      return;
    }
    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(7));
        setLng(pos.coords.longitude.toFixed(7));
        setIsDetectingGps(false);
      },
      (err) => {
        alert("Gagal mendeteksi lokasi GPS: " + err.message);
        setIsDetectingGps(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const fetchProfile = () => {
    // Load local stored vehicle preference if available
    if (typeof window !== "undefined") {
      const savedVehicle = localStorage.getItem(
        "agrowaste_courier_vehicle_type",
      );
      if (savedVehicle === "Motor" || savedVehicle === "Mobil Pick-up") {
        setVehicleType(savedVehicle);
      }
    }

    apiFetch("/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((json: ProfileResponse | null) => {
        if (json?.success && json?.data) {
          const u = json.data;
          setFullName(u.name || "");
          setPhone(u.phone || "");
          setEmail(u.email || "");
          setAvatarUrl(u.avatar_url || "");
          if (u.logistik_profile) {
            setCompanyName(u.logistik_profile.company_name || "");
            setVehiclePlate(u.logistik_profile.vehicle_plate || "");
            setLat(u.logistik_profile.lat ? String(u.logistik_profile.lat) : "");
            setLng(u.logistik_profile.lng ? String(u.logistik_profile.lng) : "");
            setAlamatPosisi(u.logistik_profile.alamat_posisi || "");
            setKecamatan(u.logistik_profile.kecamatan || "");
            setKabupaten(u.logistik_profile.kabupaten || "");
            setProvinsi(u.logistik_profile.provinsi || "");
            if (
              u.logistik_profile.vehicle_type === "Motor" ||
              u.logistik_profile.vehicle_type === "Mobil Pick-up"
            ) {
              setVehicleType(u.logistik_profile.vehicle_type);
            }
          }
        } else {
          setErrorMsg("Gagal memuat profil kurir.");
        }
      })
      .catch(() => {
        setErrorMsg("Tidak dapat terhubung ke server.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const liveShippingSample = useMemo(() => {
    const sampleWeight = vehicleType === "Motor" ? 20 : 150;
    return calculateDeliveryCost(15, sampleWeight);
  }, [vehicleType]);

  function formatRupiah(n: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(n);
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    // Save vehicle preference locally
    if (typeof window !== "undefined") {
      localStorage.setItem("agrowaste_courier_vehicle_type", vehicleType);
    }

    try {
      const body = {
        name: fullName,
        email: email,
        phone: phone,
        avatar_url: avatarUrl || null,
        company_name: companyName,
        vehicle_plate: vehiclePlate,
        vehicle_type: vehicleType,
        lat: lat ? Number(lat) : null,
        lng: lng ? Number(lng) : null,
        alamat_posisi: alamatPosisi || null,
        kecamatan: kecamatan || null,
        kabupaten: kabupaten || null,
        provinsi: provinsi || null,
      };

      const res = await apiFetch("/profile", {
        method: "PUT",
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        // update cached auth
        const token = getToken();
        if (token && json.data) {
          saveAuth(token, {
            id: json.data.id,
            name: json.data.name,
            email: json.data.email,
            role: json.data.role,
          });
        }
        setIsSuccessModalOpen(true);
      } else {
        setErrorMsg(json.message || "Gagal memperbarui profil.");
      }
    } catch {
      setErrorMsg("Terjadi kesalahan koneksi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center animate-pulse text-courier-textsecondary">
        Memuat form pengaturan profil...
      </div>
    );
  }

  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    fullName,
  )}&background=2F5A28&color=fff&rounded=true`;

  return (
    <>
      <div className="space-y-8 pb-20">
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold tracking-tight text-courier-primary mb-2">
            Pengaturan Profil
          </h2>
          <p className="text-sm text-courier-textsecondary">
            Kelola informasi pribadi, detail kendaraan, dan keamanan akun kamu.
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Profile Card */}
          <div className="lg:col-span-4 bg-courier-surfacewhite border border-courier-hairline rounded-2xl p-8 shadow-sm flex flex-col items-center text-center">
            <div className="w-32 h-32 rounded-2xl bg-courier-primary/10 mb-6 p-2 relative group cursor-pointer">
              <div className="absolute inset-0 bg-courier-primary rounded-2xl overflow-hidden">
                <div className="absolute top-2 left-2 w-8 h-8 rounded-full border border-white/20"></div>
                <div className="absolute bottom-4 right-4 w-12 h-12 rounded-full border border-white/20"></div>
              </div>
              <img
                src={avatarUrl || fallbackAvatar}
                alt={fullName}
                className="w-full h-full rounded-xl object-cover relative z-10 border-2 border-white shadow-md"
              />
              <label className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20">
                {avatarUploading ? (
                  <svg className="animate-spin w-6 h-6 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                )}
                <span className="text-[10px] text-white font-bold mt-1">{avatarUploading ? "Mengupload..." : "Ganti Foto"}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/gif"
                  className="hidden"
                  disabled={avatarUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarUpload(file);
                  }}
                />
              </label>
            </div>
            <h3 className="text-lg font-bold text-courier-textprimary">
              {fullName}
            </h3>
            <p className="text-sm text-courier-textsecondary mb-2">
              {companyName || "Mitra Logistik"}
            </p>
            <p className="text-[10px] text-courier-textsecondary">Klik foto untuk mengubah</p>
          </div>

          {/* Right Column: Settings Forms & Security */}
          <div className="lg:col-span-8 space-y-6">
            {/* Tab Selection */}
            <div className="flex gap-3 border-b border-courier-hairline pb-3">
              <button
                type="button"
                onClick={() => setActiveTab("profil")}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "profil"
                    ? "bg-courier-primary text-white shadow-md shadow-courier-primary/20"
                    : "bg-courier-warmbg text-courier-textsecondary hover:text-courier-textprimary"
                }`}
              >
                Profil & Kendaraan
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("keamanan")}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "keamanan"
                    ? "bg-courier-primary text-white shadow-md shadow-courier-primary/20"
                    : "bg-courier-warmbg text-courier-textsecondary hover:text-courier-textprimary"
                }`}
              >
                Keamanan & 2FA
              </button>
            </div>

            {activeTab === "profil" && (
              <form onSubmit={handleSave} className="space-y-6">
                {/* Personal Information */}
                <div className="bg-courier-surfacewhite border border-courier-hairline rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-courier-warmbg/50 px-6 py-4 border-b border-courier-hairline">
                    <h3 className="font-bold text-courier-primary text-sm">
                      Informasi Pribadi
                    </h3>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-courier-textsecondary mb-2">
                          Nama Lengkap *
                        </label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-courier-surfacewhite border border-courier-hairline rounded-xl text-sm focus:outline-none focus:border-courier-primary focus:ring-1 focus:ring-courier-primary text-courier-textprimary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-courier-textsecondary mb-2">
                          Nomor Telepon *
                        </label>
                        <input
                          type="text"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-4 py-2.5 bg-courier-surfacewhite border border-courier-hairline rounded-xl text-sm focus:outline-none focus:border-courier-primary focus:ring-1 focus:ring-courier-primary text-courier-textprimary"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-courier-textsecondary mb-2">
                        Alamat Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2.5 bg-courier-surfacewhite border border-courier-hairline rounded-xl text-sm focus:outline-none focus:border-courier-primary focus:ring-1 focus:ring-courier-primary text-courier-textprimary"
                      />
                    </div>
                  </div>
                </div>

                {/* Vehicle Details & Ongkir Integration */}
                <div className="bg-courier-surfacewhite border border-courier-hairline rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-courier-warmbg/50 px-6 py-4 border-b border-courier-hairline flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <h3 className="font-bold text-courier-primary text-sm">
                      Detail Kendaraan Armada & Skema Tarif Ongkir
                    </h3>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 w-fit">
                      Terhubung dengan Kalkulator Ongkir
                    </span>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-courier-textsecondary mb-2">
                          Jenis Kendaraan Armada *
                        </label>
                        <CustomVehicleDropdown
                          value={vehicleType}
                          onChange={setVehicleType}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-courier-textsecondary mb-2">
                          Nama Perusahaan / Layanan *
                        </label>
                        <input
                          type="text"
                          required
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="Mis: Mandiri Trans, Kargo Hijau"
                          className="w-full px-4 py-2.5 bg-courier-surfacewhite border border-courier-hairline rounded-xl text-sm focus:outline-none focus:border-courier-primary focus:ring-1 focus:ring-courier-primary text-courier-textprimary"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-courier-textsecondary mb-2">
                          Plat Nomor Kendaraan *
                        </label>
                        <input
                          type="text"
                          required
                          value={vehiclePlate}
                          onChange={(e) => setVehiclePlate(e.target.value)}
                          placeholder="B 1234 CD"
                          className="w-full px-4 py-2.5 bg-courier-surfacewhite border border-courier-hairline rounded-xl text-sm focus:outline-none focus:border-courier-primary focus:ring-1 focus:ring-courier-primary text-courier-textprimary font-tabular uppercase"
                        />
                      </div>
                    </div>

                    {/* Live Ongkir Rate Breakdown Box */}
                    <div className="bg-[#F9F8F6] border border-courier-hairline p-5 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                            {vehicleType === "Motor" ? (
                              <MotorIcon className="w-3.5 h-3.5" />
                            ) : (
                              <TruckIcon className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <span className="text-sm font-bold text-courier-primary">
                            {vehicleType === "Motor"
                              ? "Skema Tarif Ongkir Motor"
                              : "Skema Tarif Ongkir Mobil Pick-up"}
                          </span>
                        </div>
                        <span className="text-[11px] font-medium text-courier-textsecondary">
                          Kalkulator Otomatis Sistem
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                        <div className="bg-white p-3 rounded-lg border border-courier-hairline">
                          <span className="text-[10px] text-courier-textsecondary font-bold block uppercase mb-0.5">
                            Tarif Dasar
                          </span>
                          <span className="font-extrabold text-courier-textprimary text-xs sm:text-sm">
                            {vehicleType === "Motor"
                              ? "Rp 7.000"
                              : "Rp 25.000 / armada"}
                          </span>
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-courier-hairline">
                          <span className="text-[10px] text-courier-textsecondary font-bold block uppercase mb-0.5">
                            Tarif per KM
                          </span>
                          <span className="font-extrabold text-courier-textprimary text-xs sm:text-sm">
                            {vehicleType === "Motor"
                              ? "Rp 2.000 / km"
                              : "Rp 3.500 / km"}
                          </span>
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-courier-hairline">
                          <span className="text-[10px] text-courier-textsecondary font-bold block uppercase mb-0.5">
                            Kapasitas Maksimal
                          </span>
                          <span className="font-extrabold text-courier-textprimary text-xs sm:text-sm">
                            {vehicleType === "Motor"
                              ? "25 kg"
                              : "700 kg / armada"}
                          </span>
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-emerald-200 bg-emerald-50/40">
                          <span className="text-[10px] text-emerald-800 font-bold block uppercase mb-0.5">
                            Simulasi 15 KM
                          </span>
                          <span className="font-extrabold text-emerald-700 text-xs sm:text-sm">
                            {liveShippingSample.deliveryCostDisplay} (
                            {formatRupiah(liveShippingSample.deliveryCostRaw)})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location & GPS Section */}
                <div className="bg-courier-surfacewhite border border-courier-hairline rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-courier-warmbg/50 px-6 py-4 border-b border-courier-hairline flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <div>
                      <h3 className="font-bold text-courier-primary text-sm">
                        Lokasi Presisi Kurir (GIS & GPS)
                      </h3>
                      <p className="text-[11px] text-courier-textsecondary">
                        Digunakan Admin untuk menugaskan kurir terdekat dari lokasi Peternak.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDetectGPS}
                      disabled={isDetectingGps}
                      className="px-3.5 py-1.5 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-colors shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {isDetectingGps ? "Mendeteksi..." : "Deteksi GPS Presisi"}
                    </button>
                  </div>

                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-courier-textsecondary mb-2">
                          Latitude (Garis Lintang)
                        </label>
                        <input
                          type="text"
                          value={lat}
                          onChange={(e) => setLat(e.target.value)}
                          placeholder="-7.9839"
                          className="w-full px-4 py-2.5 bg-courier-surfacewhite border border-courier-hairline rounded-xl text-sm focus:outline-none focus:border-courier-primary font-tabular"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-courier-textsecondary mb-2">
                          Longitude (Garis Bujur)
                        </label>
                        <input
                          type="text"
                          value={lng}
                          onChange={(e) => setLng(e.target.value)}
                          placeholder="112.6214"
                          className="w-full px-4 py-2.5 bg-courier-surfacewhite border border-courier-hairline rounded-xl text-sm focus:outline-none focus:border-courier-primary font-tabular"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-courier-textsecondary mb-2">
                          Kecamatan
                        </label>
                        <input
                          type="text"
                          value={kecamatan}
                          onChange={(e) => setKecamatan(e.target.value)}
                          placeholder="Klojen"
                          className="w-full px-4 py-2.5 bg-courier-surfacewhite border border-courier-hairline rounded-xl text-sm focus:outline-none focus:border-courier-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-courier-textsecondary mb-2">
                          Kota / Kabupaten
                        </label>
                        <input
                          type="text"
                          value={kabupaten}
                          onChange={(e) => setKabupaten(e.target.value)}
                          placeholder="Kota Malang"
                          className="w-full px-4 py-2.5 bg-courier-surfacewhite border border-courier-hairline rounded-xl text-sm focus:outline-none focus:border-courier-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-courier-textsecondary mb-2">
                          Provinsi
                        </label>
                        <input
                          type="text"
                          value={provinsi}
                          onChange={(e) => setProvinsi(e.target.value)}
                          placeholder="Jawa Timur"
                          className="w-full px-4 py-2.5 bg-courier-surfacewhite border border-courier-hairline rounded-xl text-sm focus:outline-none focus:border-courier-primary"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end items-center gap-6 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-courier-primary hover:bg-green-800 text-white rounded-xl text-sm font-bold transition-colors shadow-md shadow-courier-primary/20"
                  >
                    {submitting ? "Menyimpan..." : "Simpan Perubahan Profil"}
                  </button>
                </div>
              </form>
            )}

            {activeTab === "keamanan" && (
              <div className="space-y-6 animate-fade-in">
                {/* Ubah Kata Sandi */}
                <div className="bg-courier-surfacewhite border border-courier-hairline rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-courier-warmbg/50 px-6 py-4 border-b border-courier-hairline">
                    <h3 className="font-bold text-courier-primary text-sm">
                      Ubah Kata Sandi
                    </h3>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setIsSuccessModalOpen(true);
                      (e.target as HTMLFormElement).reset();
                    }}
                    className="p-6 space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-courier-textsecondary mb-1">
                          Kata Sandi Sekarang
                        </label>
                        <input
                          type="password"
                          required
                          className="w-full px-4 py-2.5 bg-courier-surfacewhite border border-courier-hairline rounded-xl text-sm focus:outline-none focus:border-courier-primary focus:ring-1 focus:ring-courier-primary text-courier-textprimary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-courier-textsecondary mb-1">
                          Kata Sandi Baru
                        </label>
                        <input
                          type="password"
                          required
                          className="w-full px-4 py-2.5 bg-courier-surfacewhite border border-courier-hairline rounded-xl text-sm focus:outline-none focus:border-courier-primary focus:ring-1 focus:ring-courier-primary text-courier-textprimary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-courier-textsecondary mb-1">
                          Ulangi Sandi Baru
                        </label>
                        <input
                          type="password"
                          required
                          className="w-full px-4 py-2.5 bg-courier-surfacewhite border border-courier-hairline rounded-xl text-sm focus:outline-none focus:border-courier-primary focus:ring-1 focus:ring-courier-primary text-courier-textprimary"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-courier-primary hover:bg-green-800 text-white font-bold text-xs rounded-xl shadow-md shadow-courier-primary/20 transition-all"
                      >
                        Perbarui Sandi
                      </button>
                    </div>
                  </form>
                </div>

                {/* 2FA Section */}
                <div className="bg-courier-surfacewhite border border-courier-hairline p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
                  <div>
                    <h3 className="text-sm font-bold text-courier-textprimary flex items-center gap-2 mb-1">
                      Autentikasi Dua Langkah (2FA)
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md font-tabular uppercase tracking-wider ${is2FAEnabled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                      >
                        {is2FAEnabled ? "AKTIF" : "NONAKTIF"}
                      </span>
                    </h3>
                    <p className="text-xs text-courier-textsecondary">
                      Tambahkan perlindungan ekstra dengan meminta verifikasi
                      kode OTP saat Anda masuk ke akun kurir.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIs2FAEnabled(!is2FAEnabled)}
                    className="px-4 py-2 bg-courier-warmbg hover:bg-courier-hairline text-courier-textprimary font-bold text-xs rounded-xl transition-all shrink-0 border border-courier-hairline"
                  >
                    {is2FAEnabled ? "Nonaktifkan 2FA" : "Aktifkan 2FA"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Sukses Simpan */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-courier-surfacewhite w-full max-w-sm rounded-3xl border border-courier-hairline overflow-hidden p-8 text-center space-y-4 animate-fade-in shadow-xl">
            <div className="w-16 h-16 bg-green-100 text-courier-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-courier-textprimary">
                Berhasil Disimpan
              </h3>
              <p className="text-sm text-courier-textsecondary mt-2">
                Data profil dan detail kendaraan logistik Anda telah berhasil
                diperbarui.
              </p>
            </div>
            <button
              onClick={() => setIsSuccessModalOpen(false)}
              className="w-full mt-6 py-3 bg-courier-primary hover:bg-green-800 text-white rounded-xl text-sm font-bold transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
}
