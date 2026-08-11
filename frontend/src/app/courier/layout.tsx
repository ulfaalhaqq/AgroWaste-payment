import CourierDashboardShell from "@/components/courier/CourierDashboardShell";
import { ReactNode } from "react";

export default function CourierLayout({ children }: { children: ReactNode }) {
  return <CourierDashboardShell>{children}</CourierDashboardShell>;
}
