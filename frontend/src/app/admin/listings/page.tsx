import { Suspense } from "react";
import { AdminListing } from "./components/AdminListing";

export default function ListingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <AdminListing />
    </Suspense>
  );
}
