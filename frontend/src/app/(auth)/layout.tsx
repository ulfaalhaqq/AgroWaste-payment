import React from "react";

export const metadata = {
  title: "Authentication | AgroWaste",
  description: "Masuk atau daftar ke ekosistem sirkular AgroWaste.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FFF8F5] text-[#111111] selection:bg-[#009A44] selection:text-white font-sans">
      {children}
    </div>
  );
}
