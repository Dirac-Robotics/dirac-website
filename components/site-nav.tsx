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

function navLinkClass(active: boolean) {
  // Nav links are body sans, not mono.
  return cn(
    "text-[0.8125rem] tracking-[0.01em] transition-colors",
    active ? "text-foreground" : "text-body hover:text-foreground",
  );
}

export function SiteNav() {
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
                      "rounded-md px-3 py-3 text-[0.9375rem] transition-colors",
                      active
                        ? "bg-muted text-foreground"
                        : "text-body hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
