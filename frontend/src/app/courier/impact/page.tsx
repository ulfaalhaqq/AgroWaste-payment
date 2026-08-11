"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CourierImpactTracker() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/courier");
  }, [router]);

  return null;
}
