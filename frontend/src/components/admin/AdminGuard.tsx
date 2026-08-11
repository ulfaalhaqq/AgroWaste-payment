"use client";

import { useEffect, useState } from "react";
import { getToken, getUser } from "@/lib/auth";

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    const user = getUser();

    if (!token) {
      window.location.replace("/login?callbackUrl=/admin");
      return;
    }

    if (!user || user.role !== "admin") {
      window.location.replace("/");
      return;
    }

    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-admin-primary/20 border-t-admin-primary animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
