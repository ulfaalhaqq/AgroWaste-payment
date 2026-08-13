"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();
      setMessage(data.message);
      setStatus(res.ok ? "sent" : "error");
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
          {status === "sent" ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-land-clay/10 flex items-center justify-center mb-6 mx-auto">
                <svg
                  className="w-8 h-8 text-land-clay"
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
              <h1 className="text-3xl font-bold text-land-ink font-land-heading mb-2">
                Cek Email Kamu
              </h1>
              <p className="text-land-muted text-sm leading-relaxed mb-8">
                Link reset password sudah dikirim ke{" "}
                <strong className="text-land-ink">{email}</strong>. Cek folder
                inbox atau spam.
              </p>
              <Link
                href="/login"
                className="text-sm text-land-clay hover:text-land-muted font-medium transition-colors"
              >
                ← Kembali ke login
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-land-ink font-land-heading mb-2">
                  Lupa Password?
                </h1>
                <p className="text-land-muted text-sm leading-relaxed">
                  Masukkan email akunmu. Kami akan kirimkan link untuk reset
                  password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
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

                {status === "error" && (
                  <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === "loading" || !email}
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
                      Kirim Link Reset
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}