"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { saveAuth, type AuthUser } from "@/lib/auth";

function redirectByRole(role: string): string {
  if (role === "admin") return "/admin";
  if (role === "peternak") return "/seller";
  if (role === "logistik") return "/courier";
  return "/marketplace";
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [adminPhone, setAdminPhone] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/contact")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data?.phone) {
          setAdminPhone(json.data.phone);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.message ?? "Email atau password salah.");
        setIsLoading(false);
        return;
      }

      const { token, user } = json.data as { token: string; user: AuthUser };
      saveAuth(token, user);
      window.dispatchEvent(new Event("auth-change"));

      const destination = callbackUrl ?? redirectByRole(user.role);
      router.push(destination);
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server. Coba lagi.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-land-bg font-land-body">
      {/* Left Form Side */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-4 sm:px-8 md:px-16 lg:px-24 xl:px-32 relative animate-fade-in py-12">
        {/* Logo */}
        <div className="absolute top-8 left-4 sm:left-8 md:left-16 lg:left-24 xl:left-32">
          <Link
            href="/"
            className="flex items-center gap-2.5 hover:opacity-85 transition-opacity"
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

        <div className="mt-16 mb-8 max-w-sm w-full mx-auto lg:mx-0">
          <h1 className="text-3xl font-bold text-land-ink font-land-heading mb-2">
            Masuk ke Akun Anda
          </h1>
          <p className="text-land-muted text-sm leading-relaxed max-w-sm">
            Selamat datang kembali di portal manajemen AgroWaste.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="space-y-6 max-w-sm w-full mb-8 mx-auto lg:mx-0"
        >
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
            <div className="flex justify-between items-center mb-2">
              <label className="block text-[10px] font-bold text-land-ink uppercase tracking-wider">
                Kata Sandi
              </label>
            </div>
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
                className="block w-full rounded-xl border border-land-cream py-3.5 pl-12 pr-12 text-land-ink placeholder:text-land-muted/40 focus:ring-2 focus:ring-land-clay/20 focus:border-land-clay text-sm bg-white shadow-sm transition-all tracking-widest"
              />
            </div>
          </div>

          <div className="flex items-center">
            <div className="relative w-4 h-4 shrink-0">
              <input
                id="remember"
                type="checkbox"
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
              htmlFor="remember"
              className="ml-2 text-sm text-land-muted cursor-pointer select-none font-semibold"
            >
              Ingat Saya
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
            className="w-full py-3.5 bg-land-clay hover:bg-land-clay-hover text-white font-bold rounded-xl shadow-md shadow-land-clay/15 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed min-h-[48px]"
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
                Masuk ke Akun
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

        <div className="max-w-sm w-full text-center mb-8 border-b border-land-cream pb-8 mx-auto lg:mx-0">
          <p className="text-sm text-land-muted">
            Belum punya akun?{" "}
            <Link
              href="/role"
              className="font-bold text-land-clay hover:text-land-clay-hover"
            >
              Daftar di sini
            </Link>
          </p>
        </div>

        {/* Mitra Selection (Decorative Links matching design) */}
        <div className="max-w-sm w-full mx-auto lg:mx-0">
          <p className="text-[10px] font-bold text-land-muted uppercase tracking-wider text-center mb-4">
            Masuk Sebagai Mitra
          </p>
          <div className="grid grid-cols-3 gap-3">
            <Link
              href="/role"
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-land-cream bg-white hover:border-land-secondary hover:bg-land-warm/10 transition-all group"
            >
              <svg
                className="w-5 h-5 text-land-secondary group-hover:scale-105 transition-transform"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                ></path>
              </svg>
              <span className="text-[9px] font-bold text-land-ink">
                Peternak
              </span>
            </Link>
            <Link
              href="/role"
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-land-cream bg-white hover:border-land-clay hover:bg-land-warm/10 transition-all group"
            >
              <svg
                className="w-5 h-5 text-land-clay group-hover:scale-105 transition-transform"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                ></path>
              </svg>
              <span className="text-[9px] font-bold text-land-ink">
                Pembeli
              </span>
            </Link>
            <a
              href={(() => {
                const raw = (adminPhone ?? "6281234567890").replace(/\D/g, "");
                const wa = raw.startsWith("0") ? "62" + raw.slice(1) : raw.startsWith("62") ? raw : "62" + raw;
                return `https://wa.me/${wa}?text=Halo%20Admin%20AgroWaste%2C%20saya%20ingin%20mendaftar%20sebagai%20Mitra%20Kurir%20Logistik.`;
              })()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-land-cream bg-white hover:border-land-ink hover:bg-land-warm/10 transition-all group"
            >
              <svg
                className="w-5 h-5 text-land-ink group-hover:scale-105 transition-transform"
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
              <span className="text-[9px] font-bold text-land-ink">
                Logistik
              </span>
            </a>
          </div>
        </div>
      </div>

      {/* Right Image Side */}
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
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
