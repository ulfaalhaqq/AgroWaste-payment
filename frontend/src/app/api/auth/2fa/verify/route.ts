import { NextResponse } from "next/server";
import { verifyTotpToken } from "@/lib/totp";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { secret, token } = body;

    if (!secret || !token) {
      return NextResponse.json(
        { success: false, message: "Secret dan token 6-digit wajib diisi" },
        { status: 400 },
      );
    }

    const isValid = await verifyTotpToken(secret, token);

    if (isValid) {
      return NextResponse.json({
        success: true,
        message:
          "2FA Google Authenticator berhasil diverifikasi dan diaktifkan",
      });
    }

    return NextResponse.json(
      { success: false, message: "Kode OTP 2FA tidak valid atau kedaluwarsa" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat memverifikasi 2FA" },
      { status: 500 },
    );
  }
}
