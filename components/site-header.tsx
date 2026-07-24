import Link from "next/link";

import { getCurrentUser } from "@/lib/session";
import { Logo } from "@/components/logo";
import { SiteNav } from "@/components/site-nav";

/**
 * Header appears on every page (rendered from the root layout). Server
 * component so the signed-in state is known without a client round trip.
 */
export async function SiteHeader() {
  const user = await getCurrentUser();
  const navUser = user ? { email: user.email, role: user.role } : null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          aria-label="Dirac Robotics home"
          className="rounded-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <Logo size="sm" />
        </Link>
        <SiteNav user={navUser} />
      </div>
    </header>
  );
}
