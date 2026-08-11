import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";

export const metadata = {
  title: "AgroWaste | Platform Pertanian Sirkular",
  description:
    "Platform ekonomi sirkular pertama di Indonesia yang menghubungkan peternak dengan pembeli.",
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-land-bg font-land-body text-land-ink flex flex-col">
      <Header />

      {/* Konten Utama */}
      <main className="flex-1 flex flex-col mt-16">{children}</main>

      <Footer />
    </div>
  );
}
