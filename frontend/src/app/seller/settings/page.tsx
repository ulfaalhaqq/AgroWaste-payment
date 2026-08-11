"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { saveAuth, getToken } from "@/lib/auth";
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
      nama_kandang: string;
      deskripsi: string | null;
      provinsi: string;
      kabupaten: string;
      kecamatan: string;
      lat: string | number | null;
      lng: string | number | null;
      bank_account: string | null;
    };
  };
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profil");
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);

  const [ownerName, setOwnerName] = useState("");
  const [farmName, setFarmName] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [provinsi, setProvinsi] = useState("");
  const [kabupaten, setKabupaten] = useState("");
  const [kecamatan, setKecamatan] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [lat, setLat] = useState<number | string>("");
  const [lng, setLng] = useState<number | string>("");
  const [bankAccount, setBankAccount] = useState("");

  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);
  const [markerInstance, setMarkerInstance] = useState<LeafletMarker | null>(
    null,
  );

  useEffect(() => {
    apiFetch("/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((json: ProfileResponse | null) => {
        if (json?.success && json?.data) {
          const u = json.data;
          setOwnerName(u.name || "");
          setEmail(u.email || "");
          setPhone(u.phone || "");
          setAvatarUrl(u.avatar_url || "");

          if (u.peternak_profile) {
            setFarmName(u.peternak_profile.nama_kandang || "");
            setDescription(u.peternak_profile.deskripsi || "");
            setProvinsi(u.peternak_profile.provinsi || "");
            setKabupaten(u.peternak_profile.kabupaten || "");
            setKecamatan(u.peternak_profile.kecamatan || "");
            setLat(
              u.peternak_profile.lat !== null &&
                u.peternak_profile.lat !== undefined
                ? u.peternak_profile.lat
                : "",
            );
            setLng(
              u.peternak_profile.lng !== null &&
                u.peternak_profile.lng !== undefined
                ? u.peternak_profile.lng
                : "",
            );
            setBankAccount(u.peternak_profile.bank_account || "");
          }
        } else {
          setErrorMsg("Gagal memuat profil.");
        }
      })
      .catch(() => {
        setErrorMsg("Tidak dapat terhubung ke server.");
      })
      .finally(() => setLoading(false));
  }, []);

  // lazy-load Leaflet from CDN
  useEffect(() => {
    const cssId = "leaflet-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const jsId = "leaflet-js";
    if (!document.getElementById(jsId)) {
      const script = document.createElement("script");
      script.id = jsId;
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => setLeafletLoaded(true);
      document.body.appendChild(script);
    } else {
      if (window.L) {
        setLeafletLoaded(true);
      }
    }
  }, []);

  // init map once Leaflet is ready
  useEffect(() => {
    if (!leafletLoaded || loading || activeTab !== "lokasi") return;
    const mapElement = document.getElementById("seller-gis-map");
    if (!mapElement) return;

    const L = window.L;
    if (!L) return;

    let initialLat = -7.8924;
    let initialLng = 112.6563;
    if (lat && lng) {
      initialLat = Number(lat);
      initialLng = Number(lng);
    }

    const map = L.map("seller-gis-map").setView([initialLat, initialLng], 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    const marker = L.marker([initialLat, initialLng], {
      draggable: true,
    }).addTo(map);

    // sync coords on drag
    marker.on("dragend", () => {
      const position = marker.getLatLng();
      setLat(position.lat.toFixed(6));
      setLng(position.lng.toFixed(6));
    });

    // sync coords on click
    map.on("click", (e: LeafletMouseEvent) => {
      const coords = e.latlng;
      marker.setLatLng(coords);
      setLat(coords.lat.toFixed(6));
      setLng(coords.lng.toFixed(6));
    });

    setMapInstance(map);
    setMarkerInstance(marker);

    return () => {
      map.remove();
    };
  }, [leafletLoaded, loading, activeTab]);

  const handleLatChange = (val: string) => {
    setLat(val);
    const num = Number(val);
    if (
      !isNaN(num) &&
      num >= -90 &&
      num <= 90 &&
      mapInstance &&
      markerInstance
    ) {
      markerInstance.setLatLng([num, markerInstance.getLatLng().lng]);
      mapInstance.panTo([num, markerInstance.getLatLng().lng]);
    }
  };

  const handleLngChange = (val: string) => {
    setLng(val);
    const num = Number(val);
    if (
      !isNaN(num) &&
      num >= -180 &&
      num <= 180 &&
      mapInstance &&
      markerInstance
    ) {
      markerInstance.setLatLng([markerInstance.getLatLng().lat, num]);
      mapInstance.panTo([markerInstance.getLatLng().lat, num]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const body = {
        name: ownerName,
        email: email,
        phone: phone,
        avatar_url: avatarUrl || null,
        nama_kandang: farmName,
        deskripsi: description || null,
        provinsi: provinsi,
        kabupaten: kabupaten,
        kecamatan: kecamatan,
        lat: lat !== "" ? Number(lat) : null,
        lng: lng !== "" ? Number(lng) : null,
        bank_account: bankAccount || null,
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
      setErrorMsg("Terjadi kesalahan koneksi server.");
    } finally {
      setSubmitting(false);
    }
  };

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
      } else {
        setErrorMsg(json.message ?? "Gagal mengunggah foto.");
      }
    } catch {
      setErrorMsg("Gagal terhubung ke server saat upload foto.");
    } finally {
      setAvatarUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse pb-10">
        <div className="h-8 w-48 bg-[#EAE6E1] rounded mb-6"></div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <div className="h-10 bg-[#EAE6E1] rounded-xl"></div>
            <div className="h-10 bg-[#EAE6E1] rounded-xl"></div>
          </div>
          <div className="lg:col-span-3 space-y-6">
            <div className="h-64 bg-[#EAE6E1] rounded-2xl"></div>
            <div className="h-64 bg-[#EAE6E1] rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    farmName || ownerName,
  )}&background=3F4F44&color=fff&rounded=true`;

  return (
    <>
      <div className="space-y-6 animate-fade-in pb-10">
        <h2 className="text-3xl font-bold tracking-tight text-seller-textprimary mb-6">
          Pengaturan Akun Saya
        </h2>
        <p className="text-seller-textsecondary mb-8">
          Perbarui informasi profil peternakan dan kontak Anda.
        </p>

        {errorMsg && (
          <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl mb-6">
            {errorMsg}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Bagian Kiri: Tab Navigasi */}
          <div className="w-full lg:w-64 shrink-0">
            <div className="bg-seller-surfacewhite border border-seller-hairline rounded-2xl overflow-hidden sticky top-8">
              <button
                type="button"
                className={`w-full text-left px-5 py-4 font-bold text-sm transition-colors ${
                  activeTab === "profil"
                    ? "bg-[#33463B] text-white border-l-4 border-[#5E9B71]"
                    : "text-seller-textsecondary hover:bg-seller-warmbg"
                }`}
                onClick={() => setActiveTab("profil")}
              >
                Profil Peternakan
              </button>
              <button
                type="button"
                className={`w-full text-left px-5 py-4 font-bold text-sm transition-colors ${
                  activeTab === "lokasi"
                    ? "bg-[#33463B] text-white border-l-4 border-[#5E9B71]"
                    : "text-seller-textsecondary hover:bg-seller-warmbg"
                }`}
                onClick={() => setActiveTab("lokasi")}
              >
                Lokasi & Kontak
              </button>
              <button
                type="button"
                className={`w-full text-left px-5 py-4 font-bold text-sm transition-colors ${
                  activeTab === "keamanan"
                    ? "bg-[#33463B] text-white border-l-4 border-[#5E9B71]"
                    : "text-seller-textsecondary hover:bg-seller-warmbg"
                }`}
                onClick={() => setActiveTab("keamanan")}
              >
                Keamanan & 2FA
              </button>
            </div>
          </div>

          {/* Bagian Kanan: Form Konten */}
          <form
            onSubmit={handleSave}
            className="flex-1 bg-seller-surfacewhite border border-seller-hairline rounded-2xl p-6 lg:p-8 relative"
          >
            {activeTab === "profil" && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-lg font-bold text-seller-textprimary border-b border-seller-hairline pb-4 mb-6">
                  Informasi Dasar
                </h3>

                <div className="flex items-center gap-6 mb-6">
                  <div className="relative group w-20 h-20 rounded-2xl bg-seller-warmbg border border-seller-hairline overflow-hidden shrink-0">
                    <img
                      src={avatarUrl || fallbackAvatar}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = fallbackAvatar;
                      }}
                    />
                    <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      {avatarUploading ? (
                        <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                      )}
                      <span className="text-[9px] text-white font-bold mt-1">{avatarUploading ? "Mengupload..." : "Ganti Foto"}</span>
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
                  <div className="flex-1">
                    <p className="text-sm font-bold text-seller-textprimary">{ownerName || "Nama Peternak"}</p>
                    <p className="text-xs text-seller-textsecondary mt-0.5">{farmName || "Nama Peternakan"}</p>
                    <p className="text-[10px] text-seller-textsecondary mt-2">Klik foto untuk mengubah. Format: JPG, PNG, GIF. Maks 2MB.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-seller-textsecondary mb-1">
                      Nama Pemilik *
                    </label>
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-seller-warmbg border border-seller-hairline rounded-xl text-sm text-seller-textprimary focus:outline-none focus:ring-1 focus:ring-seller-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-seller-textsecondary mb-1">
                      Nama Peternakan *
                    </label>
                    <input
                      type="text"
                      required
                      value={farmName}
                      onChange={(e) => setFarmName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-seller-warmbg border border-seller-hairline rounded-xl text-sm text-seller-textprimary focus:outline-none focus:ring-1 focus:ring-seller-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-seller-textsecondary mb-1">
                    Deskripsi Singkat
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ceritakan tentang peternakan Anda..."
                    className="w-full px-4 py-2.5 bg-seller-warmbg border border-seller-hairline rounded-xl text-sm text-seller-textprimary focus:outline-none focus:ring-1 focus:ring-seller-primary resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-seller-textsecondary mb-1">
                    Nomor Rekening Penjual
                  </label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="Contoh: BCA 1234567890 a.n. Budi"
                    className="w-full px-4 py-2.5 bg-seller-warmbg border border-seller-hairline rounded-xl text-sm text-seller-textprimary focus:outline-none focus:ring-1 focus:ring-seller-primary"
                  />
                  <p className="text-[10px] text-seller-textsecondary mt-1">
                    Digunakan untuk menerima pembayaran manual dari pembeli.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "lokasi" && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-lg font-bold text-seller-textprimary border-b border-seller-hairline pb-4 mb-6">
                  Lokasi & Kontak
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-seller-textsecondary mb-1">
                      Provinsi *
                    </label>
                    <input
                      type="text"
                      required
                      value={provinsi}
                      onChange={(e) => setProvinsi(e.target.value)}
                      className="w-full px-4 py-2 bg-seller-warmbg border border-seller-hairline rounded-xl text-sm text-seller-textprimary focus:outline-none focus:ring-1 focus:ring-seller-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-seller-textsecondary mb-1">
                      Kabupaten/Kota *
                    </label>
                    <input
                      type="text"
                      required
                      value={kabupaten}
                      onChange={(e) => setKabupaten(e.target.value)}
                      className="w-full px-4 py-2 bg-seller-warmbg border border-seller-hairline rounded-xl text-sm text-seller-textprimary focus:outline-none focus:ring-1 focus:ring-seller-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-seller-textsecondary mb-1">
                      Kecamatan *
                    </label>
                    <input
                      type="text"
                      required
                      value={kecamatan}
                      onChange={(e) => setKecamatan(e.target.value)}
                      className="w-full px-4 py-2 bg-seller-warmbg border border-seller-hairline rounded-xl text-sm text-seller-textprimary focus:outline-none focus:ring-1 focus:ring-seller-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-seller-textsecondary mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 bg-seller-warmbg border border-seller-hairline rounded-xl text-sm text-seller-textprimary font-tabular focus:outline-none focus:ring-1 focus:ring-seller-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-seller-textsecondary mb-1">
                      No. Handphone *
                    </label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2.5 bg-seller-warmbg border border-seller-hairline rounded-xl text-sm text-seller-textprimary font-tabular focus:outline-none focus:ring-1 focus:ring-seller-primary"
                    />
                  </div>
                </div>

                {/* Peta GIS */}
                <div className="pt-6 border-t border-seller-hairline mt-6">
                  <h4 className="text-sm font-bold text-seller-textprimary mb-1">
                    Koordinat Titik Lokasi GIS Peternakan
                  </h4>
                  <p className="text-xs text-seller-textsecondary mb-4">
                    Tentukan titik presisi lokasi peternakan Anda di peta bawah.
                    Anda dapat menyeret (drag) pin pada peta atau mengeklik
                    lokasi mana pun untuk mengubah koordinat secara instan.
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-bold text-seller-textsecondary mb-1">
                        Latitude (Lintang)
                      </label>
                      <input
                        type="text"
                        value={lat}
                        readOnly
                        className="w-full px-4 py-2 bg-seller-warmbg border border-seller-hairline rounded-xl text-sm text-seller-textprimary font-tabular focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-seller-textsecondary mb-1">
                        Longitude (Bujur)
                      </label>
                      <input
                        type="text"
                        value={lng}
                        readOnly
                        className="w-full px-4 py-2 bg-seller-warmbg border border-seller-hairline rounded-xl text-sm text-seller-textprimary font-tabular focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="w-full h-[300px] rounded-xl overflow-hidden border-2 border-seller-hairline relative">
                    {leafletLoaded ? (
                      <div id="seller-gis-map" className="w-full h-full z-0" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-seller-warmbg text-seller-textsecondary text-xs animate-pulse">
                        Memuat Peta...
                      </div>
                    )}
                  </div>
                  <p className="text-[9px] text-seller-textsecondary mt-2 text-right">
                    * Koordinat ini akan dibaca secara real-time oleh mitra
                    kurir untuk merencanakan rute pengiriman dan penjemputan
                    limbah.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "keamanan" && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-lg font-bold text-seller-textprimary border-b border-seller-hairline pb-4 mb-6">
                  Ubah Kata Sandi
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-seller-textsecondary mb-1">
                      Kata Sandi Sekarang
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-2.5 bg-seller-warmbg border border-seller-hairline rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#5E9B71] text-seller-textprimary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-seller-textsecondary mb-1">
                      Kata Sandi Baru
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-2.5 bg-seller-warmbg border border-seller-hairline rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#5E9B71] text-seller-textprimary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-seller-textsecondary mb-1">
                      Ulangi Sandi Baru
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-2.5 bg-seller-warmbg border border-seller-hairline rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#5E9B71] text-seller-textprimary"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-seller-hairline">
                  <h3 className="text-lg font-bold text-seller-textprimary mb-2 flex items-center justify-between">
                    <span>Autentikasi Dua Langkah (2FA)</span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md font-tabular uppercase tracking-wider ${is2FAEnabled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {is2FAEnabled ? "AKTIF" : "NONAKTIF"}
                    </span>
                  </h3>
                  <p className="text-xs text-seller-textsecondary mb-4">
                    Tambahkan tingkat keamanan tambahan untuk melindungi akun
                    toko peternakan Anda saat masuk sistem.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (is2FAEnabled) {
                        setIs2FAEnabled(false);
                      } else {
                        setIs2FAModalOpen(true);
                      }
                    }}
                    className="px-4 py-2 bg-seller-warmbg hover:bg-seller-hairline text-seller-textprimary font-bold text-xs rounded-xl transition-all border border-seller-hairline"
                  >
                    {is2FAEnabled
                      ? "Nonaktifkan 2FA"
                      : "Aktifkan 2FA (Scan QR)"}
                  </button>
                </div>
              </div>
            )}

            {/* 2FA Google Authenticator Modal */}
            <TwoFactorModal
              isOpen={is2FAModalOpen}
              userEmail={email || "peternak@agrowaste.id"}
              userName={ownerName || "Peternak AgroWaste"}
              onClose={() => setIs2FAModalOpen(false)}
              onSuccess={() => {
                setIs2FAEnabled(true);
              }}
            />

            <div className="mt-8 pt-6 border-t border-seller-hairline flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-[#33463B] text-white rounded-xl text-sm font-bold hover:bg-[#25352c] transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {submitting && (
                  <svg
                    className="w-4 h-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      strokeWidth="3"
                      strokeOpacity="0.25"
                    />
                    <path
                      d="M12 2a10 10 0 0 1 10 10"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
                {submitting ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {isSuccessModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-seller-surfacewhite w-full max-w-sm rounded-3xl border border-seller-hairline overflow-hidden p-8 text-center space-y-4 animate-fade-in shadow-xl">
            <div className="w-16 h-16 bg-seller-primary-light text-seller-primary rounded-full flex items-center justify-center mx-auto mb-4">
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
              <h3 className="text-xl font-bold text-seller-textprimary">
                Berhasil Disimpan
              </h3>
              <p className="text-sm text-seller-textsecondary mt-2">
                Perubahan profil peternakan Anda telah berhasil diperbarui di
                server dan lokal.
              </p>
            </div>
            <button
              onClick={() => setIsSuccessModalOpen(false)}
              className="w-full mt-6 py-3 bg-seller-primary hover:bg-seller-primary-hover text-white rounded-xl text-sm font-bold transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
}
