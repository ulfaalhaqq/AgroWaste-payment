"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CourierPaymentsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/courier");
  }, [router]);

  return null;
}
