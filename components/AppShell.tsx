"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import NavTabs from "./NavTabs";

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) return <>{children}</>;

  return (
    <div className="app-shell">
      <NavTabs />
      <div className="app-content">{children}</div>
    </div>
  );
}
