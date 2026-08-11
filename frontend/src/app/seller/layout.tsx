import SellerDashboardShell from "@/components/seller/SellerDashboardShell";

export const metadata = {
  title: "AgroWaste Peternak Dashboard",
  description: "Manajemen bisnis limbah peternakan",
};

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SellerDashboardShell>{children}</SellerDashboardShell>;
}
