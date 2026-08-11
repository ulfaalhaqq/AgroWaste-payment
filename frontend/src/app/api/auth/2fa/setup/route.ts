import { NextResponse } from "next/server";
import {
  generateBase32Secret,
  buildOtpAuthUri,
  getQrCodeImageUrl,
} from "@/lib/totp";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = body.email || "pengguna@agrowaste.id";

    const secret = generateBase32Secret(16);
    const otpAuthUri = buildOtpAuthUri(email, "AgroWaste", secret);
    const qrCodeUrl = getQrCodeImageUrl(otpAuthUri);

    return NextResponse.json({
      success: true,
      data: {
        secret,
        otpAuthUri,
        qrCodeUrl,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal memproses setup 2FA" },
      { status: 500 },
    );
  }
}
