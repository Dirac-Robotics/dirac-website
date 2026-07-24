"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { NAV_ITEMS, isActivePath } from "@/lib/site";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { signOutAction } from "@/app/signin/actions";

type NavUser = { email?: string | null; role: "user" | "admin" } | null;

function navLinkClass(active: boolean) {
  return cn(
    "mono text-[0.72rem] uppercase tracking-[0.16em] transition-colors",
    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
  );
}

function AuthArea({ user }: { user: NavUser }) {
  if (!user) {
    return (
      <Button asChild size="sm" variant="outline">
        <Link href="/signin">Sign in</Link>
      </Button>
    );
  }
  return (
    <div className="flex items-center gap-3">
      {user.role === "admin" ? (
        <Link href="/admin" className={navLinkClass(false)}>
          Admin
        </Link>
      ) : null}
      <form action={signOutAction}>
        <Button type="submit" size="sm" variant="ghost">
          Sign out
        </Button>
      </form>
    </div>
  );
}

export function SiteNav({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex items-center gap-6">
      {/* Desktop nav */}
      <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={navLinkClass(active)}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="hidden md:block">
        <AuthArea user={user} />
      </div>

      {/* Mobile nav */}
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Open menu">
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 gap-0 p-0">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <div className="flex items-center px-5 py-4">
              <Logo size="sm" />
            </div>
            <div className="hairline" />
            <nav
              className="flex flex-col px-2 py-3"
              aria-label="Mobile primary"
            >
              {NAV_ITEMS.map((item) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "mono rounded-md px-3 py-3 text-[0.8rem] uppercase tracking-[0.14em] transition-colors",
                      active
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="hairline" />
            <div className="px-5 py-4">
              <AuthArea user={user} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
