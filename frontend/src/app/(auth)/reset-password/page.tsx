"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirm) return;
    if (password !== confirm) {
      setMessage("Password tidak cocok.");
      setStatus("error");
      return;
    }
    setStatus("loading");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            email,
            password,
            password_confirmation: confirm,
          }),
        }
      );

      const data = await res.json();
      setMessage(data.message);

      if (res.ok) {
        setStatus("done");
        setTimeout(() => router.push("/login"), 2500);
      } else {
        setStatus("error");
      }
    } catch {
      setMessage("Tidak dapat terhubung ke server. Coba lagi.");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-land-bg font-land-body flex flex-col">
      {/* Logo */}
      <div className="px-6 py-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 hover:opacity-85 transition-opacity w-fit"
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

      {/* Center Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm bg-white border border-land-cream rounded-2xl shadow-sm px-8 py-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-land-ink font-land-heading mb-2">
              Buat Password Baru
            </h1>
            <p className="text-land-muted text-sm leading-relaxed">
              Untuk akun{" "}
              <strong className="text-land-ink">{email}</strong>
            </p>
          </div>

          <form onSubmit={handleReset} className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-land-ink uppercase tracking-wider mb-2">
                Password Baru
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
                  placeholder="Minimal 8 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-land-cream py-3.5 pl-12 pr-4 text-land-ink placeholder:text-land-muted/40 focus:ring-2 focus:ring-land-clay/20 focus:border-land-clay text-sm bg-white shadow-sm transition-all tracking-widest"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-land-ink uppercase tracking-wider mb-2">
                Ulangi Password Baru
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
                  placeholder="Ulangi password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="block w-full rounded-xl border border-land-cream py-3.5 pl-12 pr-4 text-land-ink placeholder:text-land-muted/40 focus:ring-2 focus:ring-land-clay/20 focus:border-land-clay text-sm bg-white shadow-sm transition-all tracking-widest"
                />
              </div>
            </div>

            {message && (
              <div
                className={`rounded-xl px-4 py-3 text-sm font-medium border ${
                  status === "done"
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}
              >
                {message}
                {status === "done" && (
                  <p className="text-xs mt-1 opacity-75">
                    Mengalihkan ke halaman login...
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={
                status === "loading" ||
                status === "done" ||
                !password ||
                !confirm
              }
              className="w-full py-3.5 bg-land-clay hover:bg-land-clay-hover text-white font-bold rounded-xl shadow-md shadow-land-clay/15 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed min-h-[48px]"
            >
              {status === "loading" ? (
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
                  Simpan Password Baru
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

            <div className="text-center">
              <Link
                href="/login"
                className="text-sm text-land-clay hover:text-land-muted font-medium transition-colors"
              >
                ← Kembali ke login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-land-bg text-land-muted text-sm">
          Loading...
        </div>
      }
    >
      <ResetForm />
    </Suspense>
  );
}