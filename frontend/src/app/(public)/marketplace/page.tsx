import { Suspense } from "react";
import MarketplaceContent from "./MarketplaceContent";

export const metadata = {
  title: "Pasar Pupuk Organik | AgroWaste",
};

export default function MarketplacePage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-land-bg animate-pulse" />}
    >
      <MarketplaceContent />
    </Suspense>
  );
}
