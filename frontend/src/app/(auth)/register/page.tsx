"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { saveAuth, type AuthUser } from "@/lib/auth";

function toApiRole(param: string): "peternak" | "pembeli" | "logistik" | null {
  if (param === "penjual" || param === "peternak") return "peternak";
  if (param === "pembeli") return "pembeli";
  if (param === "logistik" || param === "kurir") return "logistik";
  return null;
}

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role") || "pembeli";
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const displayRole =
    roleParam === "penjual"
      ? "Penjual (Peternak)"
      : "Pembeli";

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const apiRole = toApiRole(roleParam);
    if (!apiRole || apiRole === "logistik") {
      setError("Pendaftaran publik hanya untuk Peternak dan Pembeli.");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Kata sandi minimal 8 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, phone, password, role: apiRole }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.message ?? "Pendaftaran gagal. Coba lagi.");
        setIsLoading(false);
        return;
      }

      const { token, user } = json.data as { token: string; user: AuthUser };
      saveAuth(token, user);
      window.dispatchEvent(new Event("auth-change"));

      const destination =
        user.role === "peternak"
          ? "/seller"
          : user.role === "logistik"
            ? "/courier"
            : "/marketplace";
      router.push(destination);
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server. Coba lagi.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-land-bg font-land-body">
      {/* Left Image Side (Register has image on left) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-land-secondary overflow-hidden">
        {/* Background Image with Dark Green Overlay */}
        <div className="absolute inset-0 bg-land-secondary mix-blend-multiply opacity-85 z-10"></div>
        <img
          src="/auth-bg.jpeg"
          alt="Pertanian"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Content Overlay */}
        <div className="relative z-20 flex flex-col justify-center px-16 xl:px-24 w-full h-full text-white">
          <div className="inline-block px-3 py-1 bg-land-clay text-white text-[10px] font-bold tracking-widest uppercase rounded-full w-max mb-6">
            Ekonomi Sirkular
          </div>

          <h2 className="text-5xl font-bold leading-tight font-land-heading mb-8">
            Mengubah Limbah
            <br />
            Menjadi Berkah.
          </h2>

          <div className="pl-6 border-l-4 border-land-clay mb-16">
            <p className="text-lg italic text-land-bg/90 leading-relaxed mb-4">
              &quot;Ekonomi sirkular bukan hanya tentang mendaur ulang; ini
              tentang merancang ulang sistem pangan kita agar selaras dengan
              alam.&quot;
            </p>
            <p className="font-bold text-land-clay font-land-heading">
              — AgroWaste Vision 2030
            </p>
          </div>
        </div>
      </div>

      {/* Right Form Side */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-4 sm:px-8 md:px-16 lg:px-24 xl:px-32 relative animate-fade-in py-12 overflow-y-auto">
        {/* Logo */}
        <div className="mb-12 mx-auto lg:mx-0">
          <Link
            href="/"
            className="flex items-center gap-2.5 hover:opacity-85 transition-opacity w-max"
          >
            <img
              src="/LOGO.png"
              alt="AgroWaste Logo"
              className="h-8 w-auto object-contain"
            />
            <span className="text-xl font-bold text-land-secondary font-land-heading tracking-tight">
              AgroWaste
            </span>
          </Link>
        </div>

        <div className="mb-8 max-w-sm w-full mx-auto lg:mx-0">
          <h1 className="text-3xl font-bold text-land-ink font-land-heading mb-4">
            Daftar Akun Baru
          </h1>
          <div className="inline-flex items-center gap-2 bg-land-warm px-4 py-2 rounded-full">
            <div className="w-2 h-2 rounded-full bg-land-clay"></div>
            <span className="text-[10px] font-bold text-land-clay">
              Mendaftar sebagai:{" "}
              <span className="uppercase">{displayRole}</span>
            </span>
          </div>
        </div>

        <form
          onSubmit={handleRegister}
          className="space-y-5 max-w-sm w-full mb-8 mx-auto lg:mx-0"
        >
          <div>
            <label className="block text-[10px] font-bold text-land-ink uppercase tracking-wider mb-2">
              Nama Lengkap
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg
                  className="w-5 h-5 text-land-muted/60"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  ></path>
                </svg>
              </div>
              <input
                type="text"
                required
                placeholder="Contoh: Budi Santoso"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full rounded-xl border border-land-cream py-3.5 pl-12 pr-4 text-land-ink placeholder:text-land-muted/40 focus:ring-2 focus:ring-land-clay/20 focus:border-land-clay text-sm bg-white shadow-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-land-ink uppercase tracking-wider mb-2">
              Alamat Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg
                  className="w-5 h-5 text-land-muted/60"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  ></path>
                </svg>
              </div>
              <input
                type="email"
                required
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-xl border border-land-cream py-3.5 pl-12 pr-4 text-land-ink placeholder:text-land-muted/40 focus:ring-2 focus:ring-land-clay/20 focus:border-land-clay text-sm bg-white shadow-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-land-ink uppercase tracking-wider mb-2">
              No. WhatsApp
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg
                  className="w-5 h-5 text-land-muted/60"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  ></path>
                </svg>
              </div>
              <input
                type="tel"
                required
                placeholder="0812xxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="block w-full rounded-xl border border-land-cream py-3.5 pl-12 pr-4 text-land-ink placeholder:text-land-muted/40 focus:ring-2 focus:ring-land-clay/20 focus:border-land-clay text-sm bg-white shadow-sm transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-land-ink uppercase tracking-wider mb-2">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-land-muted/60"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    ></path>
                  </svg>
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-land-cream py-3.5 pl-12 pr-4 text-land-ink placeholder:text-land-muted/40 focus:ring-2 focus:ring-land-clay/20 focus:border-land-clay text-sm bg-white shadow-sm transition-all tracking-widest"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-land-ink uppercase tracking-wider mb-2">
                Konfirmasi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-land-muted/60"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    ></path>
                  </svg>
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full rounded-xl border border-land-cream py-3.5 pl-12 pr-4 text-land-ink placeholder:text-land-muted/40 focus:ring-2 focus:ring-land-clay/20 focus:border-land-clay text-sm bg-white shadow-sm transition-all tracking-widest"
                />
              </div>
            </div>
          </div>

          <div className="flex items-start pt-2">
            <div className="relative w-4 h-4 mt-0.5 shrink-0">
              <input
                id="terms"
                type="checkbox"
                required
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer peer z-10 m-0"
              />
              <div className="absolute inset-0 w-full h-full rounded border border-land-cream bg-white text-transparent peer-checked:bg-land-clay peer-checked:border-land-clay peer-checked:text-white transition-all duration-200 flex items-center justify-center pointer-events-none">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
            </div>
            <label
              htmlFor="terms"
              className="ml-2 text-xs text-land-muted leading-relaxed cursor-pointer select-none font-semibold"
            >
              Saya setuju dengan{" "}
              <span className="font-bold text-land-clay">
                Syarat & Ketentuan
              </span>{" "}
              serta{" "}
              <span className="font-bold text-land-clay">
                Kebijakan Privasi
              </span>{" "}
              AgroWaste.
            </label>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 mt-2 bg-land-clay hover:bg-land-clay-hover text-white font-bold rounded-xl shadow-md shadow-land-clay/15 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed min-h-[48px]"
          >
            {isLoading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
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
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <>
                Daftar Sekarang
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
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  ></path>
                </svg>
              </>
            )}
          </button>
        </form>

        <div className="max-w-sm w-full text-center pb-8 mx-auto lg:mx-0">
          <p className="text-sm text-land-muted">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="font-bold text-land-clay hover:text-land-clay-hover"
            >
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterPageContent />
    </Suspense>
  );
}
