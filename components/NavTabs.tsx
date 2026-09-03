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
    <>
      <nav className="nav-tabs">
        <div className="nav-brand">
          <span className="nav-seed" aria-hidden="true" />
          <span className="nav-brand-name">Assistenten</span>
        </div>
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
      <svg className="nav-root-divider" viewBox="0 0 800 26" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M0,13 C120,13 160,5 260,8 C340,10 360,18 430,13 C520,7 560,20 660,13 C700,10 750,13 800,13"
          fill="none"
          strokeWidth="1"
          opacity="0.5"
        />
        <path d="M260,8 C270,2 285,-1 300,3" fill="none" strokeWidth="1" opacity="0.35" />
        <path d="M430,13 C440,20 458,22 472,18" fill="none" strokeWidth="1" opacity="0.35" />
        <path d="M660,13 C668,6 682,3 696,6" fill="none" strokeWidth="1" opacity="0.35" />
        <circle className="pulse" cx="260" cy="8" r="2.4" />
        <circle className="pulse2" cx="430" cy="13" r="2.4" />
        <circle className="pulse3" cx="660" cy="13" r="2.4" />
      </svg>
    </>
  );
}
