"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

const TABS = [
  { href: "/", label: "Chatt" },
  { href: "/att-gora", label: "Att göra" },
  { href: "/idag", label: "Idag" },
  { href: "/historik", label: "Historik" },
];

export default function NavTabs() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <nav className="nav-tabs">
      <div className="nav-tabs-links">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={pathname === tab.href ? "nav-tab active" : "nav-tab"}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      <button className="nav-logout" onClick={handleLogout}>
        Logga ut
      </button>
    </nav>
  );
}
