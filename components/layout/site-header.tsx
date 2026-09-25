"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/layout/logo";
import { SiteNav } from "@/components/layout/site-nav";

/** Header appears on every page (rendered from the root layout). */
export function SiteHeader() {
  const onHome = usePathname() === "/";
  return (
    <header className={`global-header ${onHome ? "global-header-home" : "global-header-light"}`}>
      <div className="site-container site-header flex items-center justify-between gap-4">
        <Link
          href="/"
          aria-label="Dirac Robotics home"
          className="flex shrink-0 items-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <Logo size="md" onDark={onHome} />
        </Link>
        <SiteNav />
      </div>
    </header>
  );
}
