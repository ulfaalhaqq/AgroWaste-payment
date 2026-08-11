"use client";

import React, { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { useToast } from "@/components/admin/Toast";

export default function SettingsPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("personal");
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [showMobileSession, setShowMobileSession] = useState(true);

  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileAvatarUrl, setProfileAvatarUrl] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profileBio, setProfileBio] = useState(
    "Bertanggung jawab penuh atas kelancaran moderasi marketplace limbah tani AgroWaste.",
  );

  useEffect(() => {
    apiFetch("/profile")
      .then((r) => (r.ok ? r.json() : { data: null }))
      .then((json) => {
        if (json.success && json.data) {
          setProfileName(json.data.name ?? "");
          setProfileEmail(json.data.email ?? "");
          setProfilePhone(json.data.phone ?? "");
          setProfileAvatarUrl(json.data.avatar_url ?? "");
        } else {
          const localUser = getUser();
          if (localUser) {
            setProfileName(localUser.name);
            setProfileEmail(localUser.email);
          }
        }
      })
      .catch(() => {
        const localUser = getUser();
        if (localUser) {
          setProfileName(localUser.name);
          setProfileEmail(localUser.email);
        }
      });
  }, []);

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch("/profile", {
        method: "PUT",
        body: JSON.stringify({ name: profileName, phone: profilePhone }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        // keep localStorage in sync
        const localUser = getUser();
        if (localUser) {
          localUser.name = profileName;
          localStorage.setItem("agrowaste_user", JSON.stringify(localUser));
        }
        setIsSuccessModalOpen(true);
        // reload so header reflects new name
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        showToast(json.message ?? "Gagal memperbarui profil.", "error");
      }
    } catch {
      showToast("Gagal terhubung ke server.", "error");
    }
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccessModalOpen(true);
    (e.target as HTMLFormElement).reset();
  };

  const handleAvatarUpload = async (file: File) => {
    setAvatarUploading(true);
    const formData = new FormData();
    formData.append("avatar", file);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("agrowaste_token") : null;
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
        setProfileAvatarUrl(json.data?.avatar_url ?? "");
        showToast("Foto profil berhasil diperbarui.", "success");
      } else {
        showToast(json.message ?? "Gagal mengunggah foto.", "error");
      }
    } catch {
      showToast("Gagal terhubung ke server saat upload foto.", "error");
    } finally {
      setAvatarUploading(false);
    }
  };

  const toggle2FA = () => {
    setIs2FAEnabled(!is2FAEnabled);
  };

  const revokeMobileSession = () => {
    setShowMobileSession(false);
  };

  return (
    <>
      <div className="space-y-8 animate-fade-in pb-10">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-admin-textprimary mb-1">
            Pengaturan Admin
          </h2>
          <p className="text-sm text-admin-textsecondary">
            Kelola profil administrator Anda, konfigurasi keamanan, dan pantau
            hak akses.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Settings Menu */}
          <div className="flex flex-row overflow-x-auto lg:flex-col lg:col-span-1 gap-2 pb-2 lg:pb-0 w-full scrollbar-none shrink-0">
            <button
              onClick={() => setActiveTab("personal")}
              className={`text-left px-4 py-3 rounded-xl text-sm transition-all whitespace-nowrap w-auto lg:w-full shrink-0 ${
                activeTab === "personal"
                  ? "bg-admin-primary text-white font-bold shadow-md shadow-admin-primary/20"
                  : "text-admin-textsecondary hover:bg-admin-warmbg hover:text-admin-textprimary font-semibold"
              }`}
            >
              Profil Sistem
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`text-left px-4 py-3 rounded-xl text-sm transition-all whitespace-nowrap w-auto lg:w-full shrink-0 ${
                activeTab === "security"
                  ? "bg-admin-primary text-white font-bold shadow-md shadow-admin-primary/20"
                  : "text-admin-textsecondary hover:bg-admin-warmbg hover:text-admin-textprimary font-semibold"
              }`}
            >
              Keamanan & 2FA
            </button>
            <button
              onClick={() => setActiveTab("permissions")}
              className={`text-left px-4 py-3 rounded-xl text-sm transition-all whitespace-nowrap w-auto lg:w-full shrink-0 ${
                activeTab === "permissions"
                  ? "bg-admin-primary text-white font-bold shadow-md shadow-admin-primary/20"
                  : "text-admin-textsecondary hover:bg-admin-warmbg hover:text-admin-textprimary font-semibold"
              }`}
            >
              Hak Akses Sistem
            </button>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* TAB 1: DATA DIRI */}
            {activeTab === "personal" && (
              <form
                onSubmit={handleSavePersonal}
                className="space-y-6 animate-fade-in"
              >
                {/* Informasi Dasar */}
                <div className="bg-admin-surfacewhite border border-admin-hairline p-6 rounded-2xl">
                  <h3 className="text-lg font-bold text-admin-textprimary mb-6">
                    Informasi Dasar
                  </h3>

                  <div className="flex items-center gap-6 mb-8">
                    <div className="relative group w-20 h-20 rounded-full overflow-hidden shadow-sm border border-admin-hairline cursor-pointer">
                      <img
                        src={profileAvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileName || "Admin")}&background=3F4F44&color=fff&rounded=true`}
                        alt="Foto Profil"
                        className="w-full h-full object-cover"
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
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-admin-textsecondary mb-1">
                          Nama Lengkap
                        </label>
                        <input
                          type="text"
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          required
                          className="w-full px-4 py-2.5 bg-admin-warmbg border border-admin-hairline rounded-xl text-sm font-semibold text-admin-textprimary focus:outline-none focus:ring-1 focus:ring-admin-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-admin-textsecondary mb-1">
                          ID Karyawan
                        </label>
                        <input
                          type="text"
                          value="AGW-ADM-2026-004"
                          disabled
                          className="w-full px-4 py-2.5 bg-admin-hairline/50 border border-admin-hairline rounded-xl text-sm font-bold text-admin-textsecondary font-tabular cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-admin-textsecondary mb-1">
                        Deskripsi Tugas Khusus
                      </label>
                      <textarea
                        rows={3}
                        value={profileBio}
                        onChange={(e) => setProfileBio(e.target.value)}
                        className="w-full px-4 py-2.5 bg-admin-warmbg border border-admin-hairline rounded-xl text-sm text-admin-textprimary focus:outline-none focus:ring-1 focus:ring-admin-primary"
                      ></textarea>
                    </div>
                  </div>
                </div>

                {/* Lokasi & Kontak */}
                <div className="bg-admin-surfacewhite border border-admin-hairline p-6 rounded-2xl">
                  <h3 className="text-lg font-bold text-admin-textprimary mb-6">
                    Kontak & Lokasi Tugas
                  </h3>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-admin-textsecondary mb-1">
                          Email Administrator
                        </label>
                        <input
                          type="email"
                          value={profileEmail}
                          disabled
                          className="w-full px-4 py-2.5 bg-admin-hairline/50 border border-admin-hairline rounded-xl text-sm font-bold text-admin-textsecondary cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-admin-textsecondary mb-1">
                          Nomor Handphone
                        </label>
                        <input
                          type="text"
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          placeholder="+62 8xx-xxxx-xxxx"
                          className="w-full px-4 py-2.5 bg-admin-warmbg border border-admin-hairline rounded-xl text-sm text-admin-textprimary font-tabular focus:outline-none focus:ring-1 focus:ring-admin-primary"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-admin-textsecondary mb-1">
                        Lokasi Tugas Utama
                      </label>
                      <select className="w-full px-4 py-2.5 bg-admin-warmbg border border-admin-hairline rounded-xl text-sm text-admin-textprimary focus:outline-none focus:ring-1 focus:ring-admin-primary">
                        <option value="jkt01">
                          Kantor Pusat JKT-01 (Jakarta)
                        </option>
                        <option value="bogor">Pusat Logistik Bogor</option>
                        <option value="bandung">Kantor Regional Bandung</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-admin-primary hover:bg-admin-primary-hover text-white text-sm font-bold rounded-xl shadow-md shadow-admin-primary/20 transition-colors"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: KEAMANAN & 2FA */}
            {activeTab === "security" && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-admin-surfacewhite border border-admin-hairline p-6 rounded-2xl">
                  <h3 className="text-lg font-bold text-admin-textprimary mb-6">
                    Ubah Kata Sandi
                  </h3>
                  <form onSubmit={handleSavePassword} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-admin-textsecondary mb-1">
                          Kata Sandi Sekarang
                        </label>
                        <input
                          type="password"
                          required
                          className="w-full px-4 py-2.5 bg-admin-warmbg border border-admin-hairline rounded-xl text-sm text-admin-textprimary focus:outline-none focus:ring-1 focus:ring-admin-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-admin-textsecondary mb-1">
                          Kata Sandi Baru
                        </label>
                        <input
                          type="password"
                          required
                          className="w-full px-4 py-2.5 bg-admin-warmbg border border-admin-hairline rounded-xl text-sm text-admin-textprimary focus:outline-none focus:ring-1 focus:ring-admin-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-admin-textsecondary mb-1">
                          Ulangi Sandi Baru
                        </label>
                        <input
                          type="password"
                          required
                          className="w-full px-4 py-2.5 bg-admin-warmbg border border-admin-hairline rounded-xl text-sm text-admin-textprimary focus:outline-none focus:ring-1 focus:ring-admin-primary"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-admin-primary hover:bg-admin-primary-hover text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                      >
                        Perbarui Sandi
                      </button>
                    </div>
                  </form>
                </div>

                {/* 2FA Section */}
                <div className="bg-admin-surfacewhite border border-admin-hairline p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-admin-textprimary flex items-center gap-2 mb-1">
                      Autentikasi Dua Langkah (2FA)
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md font-tabular uppercase tracking-wider ${is2FAEnabled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                      >
                        {is2FAEnabled ? "AKTIF" : "NONAKTIF"}
                      </span>
                    </h3>
                    <p className="text-sm text-admin-textsecondary">
                      Tambahkan perlindungan ekstra dengan meminta OTP saat
                      login.
                    </p>
                  </div>
                  <button
                    onClick={toggle2FA}
                    className="px-4 py-2 bg-admin-warmbg hover:bg-admin-hairline text-admin-textprimary font-bold text-xs rounded-xl transition-all shrink-0"
                  >
                    {is2FAEnabled ? "Nonaktifkan 2FA" : "Aktifkan 2FA"}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: HAK AKSES SISTEM (MATRIX) */}
            {activeTab === "permissions" && (
              <div className="bg-admin-surfacewhite border border-admin-hairline p-6 rounded-2xl animate-fade-in">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-admin-textprimary">
                    Matriks Otoritas Administrator
                  </h3>
                  <p className="text-sm text-admin-textsecondary">
                    Berikut adalah daftar modul sistem yang berada dalam cakupan
                    otorisasi akun Anda.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="p-5 border border-admin-hairline rounded-xl bg-admin-warmbg/50 flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-admin-primary/10 text-admin-primary flex items-center justify-center mb-4">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                      </div>
                      <h5 className="font-bold text-admin-textprimary mb-1">
                        Manajemen Pengguna
                      </h5>
                      <p className="text-xs text-admin-textsecondary leading-relaxed mb-4">
                        Hak penuh menulis, menonaktifkan, memverifikasi produsen
                        tani baru, dan mengekspor CSV data peternak.
                      </p>
                    </div>
                    <span className="inline-block text-[10px] font-bold text-admin-semgreen bg-green-50 px-2 py-1 rounded-md self-start">
                      HAK PENUH
                    </span>
                  </div>

                  <div className="p-5 border border-admin-hairline rounded-xl bg-admin-warmbg/50 flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-admin-primary/10 text-admin-primary flex items-center justify-center mb-4">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <h5 className="font-bold text-admin-textprimary mb-1">
                        Moderasi Listing
                      </h5>
                      <p className="text-xs text-admin-textsecondary leading-relaxed mb-4">
                        Hak penuh memvalidasi, menyetujui, dan menolak komoditas
                        limbah yang diunggah penjual.
                      </p>
                    </div>
                    <span className="inline-block text-[10px] font-bold text-admin-semgreen bg-green-50 px-2 py-1 rounded-md self-start">
                      HAK PENUH
                    </span>
                  </div>

                  <div className="p-5 border border-admin-hairline rounded-xl bg-admin-warmbg/50 flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-admin-primary/10 text-admin-primary flex items-center justify-center mb-4">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10M13 16h4l4 4V10h-8z"
                          />
                        </svg>
                      </div>
                      <h5 className="font-bold text-admin-textprimary mb-1">
                        Alokasi Logistik & GIS
                      </h5>
                      <p className="text-xs text-admin-textsecondary leading-relaxed mb-4">
                        Menugaskan kurir penjemputan, rute terlambat, dan
                        mengakses GPS tracker.
                      </p>
                    </div>
                    <span className="inline-block text-[10px] font-bold text-admin-semgreen bg-green-50 px-2 py-1 rounded-md self-start">
                      HAK PENUH
                    </span>
                  </div>

                  <div className="p-5 border border-admin-hairline rounded-xl bg-[#EBE7E0]/40 flex flex-col justify-between opacity-80">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-admin-hairline text-admin-textsecondary flex items-center justify-center mb-4">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                      <h5 className="font-bold text-admin-textsecondary mb-1">
                        Konfigurasi Server Induk
                      </h5>
                      <p className="text-xs text-admin-textsecondary leading-relaxed mb-4">
                        Akses DB SQL, modifikasi API eksternal, konfigurasi
                        master Node.js.
                      </p>
                    </div>
                    <span className="inline-block text-[10px] font-bold text-admin-semred bg-red-50 px-2 py-1 rounded-md self-start uppercase tracking-wider">
                      Hanya Baca
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Sukses Simpan */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-admin-surfacewhite w-full max-w-sm rounded-3xl border border-admin-hairline overflow-hidden p-8 text-center space-y-4 animate-fade-in shadow-xl">
            <div className="w-16 h-16 bg-admin-primary-light text-admin-primary rounded-full flex items-center justify-center mx-auto mb-4">
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
              <h3 className="text-xl font-bold text-admin-textprimary">
                Berhasil Disimpan
              </h3>
              <p className="text-sm text-admin-textsecondary mt-2">
                Perubahan profil admin Anda telah berhasil diperbarui.
              </p>
            </div>
            <button
              onClick={() => setIsSuccessModalOpen(false)}
              className="w-full mt-6 py-3 bg-admin-primary hover:bg-admin-primary-hover text-white rounded-xl text-sm font-bold transition-colors shadow-md shadow-admin-primary/20"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
}
