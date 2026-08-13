import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/admin/Toast";

export const metadata: Metadata = {
  title: "AgroWaste | Platform Penjualan Limbah Ternak",
  description:
    "Platform pengelolaan dan perdagangan limbah pertanian dan peternakan sirkular.",
  icons: {
    icon: "/LOGO.png?v=3",
    shortcut: "/LOGO.png?v=3",
    apple: "/LOGO.png?v=3",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" href="/LOGO.png?v=3" type="image/png" />
        <link rel="shortcut icon" href="/LOGO.png?v=3" type="image/png" />
        <link rel="apple-touch-icon" href="/LOGO.png?v=3" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Hanken+Grotesk:wght@600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:ital,wght@0,500;0,700;1,500&family=Nunito+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
