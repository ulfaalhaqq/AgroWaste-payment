"use client";

import React, { useState, useEffect } from "react";
import {
  generateBase32Secret,
  buildOtpAuthUri,
  getQrCodeImageUrl,
  verifyTotpToken,
} from "@/lib/totp";

interface TwoFactorModalProps {
  isOpen: boolean;
  userEmail?: string;
  userName?: string;
  onClose: () => void;
  onSuccess: (secret: string) => void;
}

export default function TwoFactorModal({
  isOpen,
  userEmail = "pengguna@agrowaste.id",
  userName = "Pengguna AgroWaste",
  onClose,
  onSuccess,
}: TwoFactorModalProps) {
  const [secret, setSecret] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"setup" | "success">("setup");

  useEffect(() => {
    if (isOpen) {
      const newSecret = generateBase32Secret(16);
      setSecret(newSecret);
      setOtpCode("");
      setError("");
      setStep("setup");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const otpAuthUri = buildOtpAuthUri(userEmail, "AgroWaste", secret);
  const qrCodeUrl = getQrCodeImageUrl(otpAuthUri);

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setError("Masukkan 6 digit kode OTP dari aplikasi Authenticator.");
      return;
    }

    setVerifying(true);
    setError("");

    try {
      const isValid = await verifyTotpToken(secret, otpCode);
      if (isValid) {
        setStep("success");
        setTimeout(() => {
          onSuccess(secret);
          onClose();
        }, 1800);
      } else {
        setError(
          "Kode OTP tidak valid atau telah kedaluwarsa. Silakan coba lagi.",
        );
      }
    } catch {
      setError("Gagal memverifikasi kode. Silakan coba lagi.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute -right-12 -top-12 w-36 h-36 bg-[#009A44]/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors text-lg"
        >
          &times;
        </button>

        {step === "setup" ? (
          <div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-[#009A44]/10 text-[#009A44] flex items-center justify-center shrink-0">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 leading-tight">
                  Pengaturan Google Authenticator
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Scan QR Code dengan aplikasi Authenticator HP Anda
                </p>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="bg-[#F8FAF9] p-4 rounded-2xl border border-gray-200/80 flex flex-col items-center justify-center mb-5 text-center">
              <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-sm mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrCodeUrl}
                  alt="2FA QR Code AgroWaste"
                  className="w-48 h-48 object-contain rounded-lg"
                />
              </div>

              {/* Secret Key Manual Copy */}
              <div className="w-full flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-gray-200 text-xs">
                <div className="truncate pr-2">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">
                    Kunci Rahasia (Manual)
                  </span>
                  <span className="font-mono font-bold text-gray-800 tracking-wider">
                    {secret}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopySecret}
                  className="px-2.5 py-1 bg-[#009A44]/10 hover:bg-[#009A44]/20 text-[#009A44] font-bold rounded-lg text-[11px] shrink-0 transition-colors"
                >
                  {copied ? "Tersalin! ✓" : "Salin"}
                </button>
              </div>
            </div>

            {/* Form Verifikasi 6 Digit */}
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Masukkan 6 Digit Kode OTP dari HP:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) =>
                    setOtpCode(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="Contoh: 123456"
                  className="w-full px-4 py-3 text-center text-xl font-bold tracking-widest bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009A44] focus:border-transparent font-mono"
                  autoFocus
                />
                {error && (
                  <p className="text-xs font-bold text-red-500 mt-1.5 text-center">
                    {error}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={verifying || otpCode.length !== 6}
                  className="w-2/3 py-2.5 bg-[#009A44] hover:bg-[#008239] text-white font-bold text-xs rounded-xl transition-colors shadow-md shadow-[#009A44]/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {verifying ? (
                    <span>Memverifikasi...</span>
                  ) : (
                    <span>Verifikasi & Aktifkan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-6 animate-scale-up">
            <div className="w-16 h-16 bg-green-100 text-[#009A44] rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-green-50 shadow-inner">
              <svg
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              Google Authenticator Aktif!
            </h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto mb-4">
              Akun AgroWaste Anda kini dilindungi secara riil dengan sistem 2FA
              Google Authenticator.
            </p>
            <span className="inline-block px-3 py-1 bg-green-50 text-[#009A44] border border-green-200 text-xs font-bold rounded-lg uppercase tracking-wider">
              Status 2FA: Aktif ✓
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
