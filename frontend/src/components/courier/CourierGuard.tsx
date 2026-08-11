"use client";

import { useEffect, useState } from "react";
import { getToken, getUser } from "@/lib/auth";

export default function CourierGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    const user = getUser();

    if (!token) {
      window.location.replace("/login?callbackUrl=/courier");
      return;
    }

    if (!user || user.role !== "logistik") {
      window.location.replace("/");
      return;
    }

    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-courier-primary/20 border-t-courier-primary animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
