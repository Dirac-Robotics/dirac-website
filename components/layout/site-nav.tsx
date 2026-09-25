"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, MenuIcon } from "lucide-react";
import { NAV_ITEMS, SITE } from "@/lib/config/site";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { ButtonLabel } from "@/components/ui/button-label";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const LINKS = NAV_ITEMS.filter((item) => item.href.startsWith("/"));

export function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const pendingNavigation = React.useRef<string | null>(null);

  function selectMobileLink(event: React.MouseEvent<HTMLAnchorElement>, href: string) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    pendingNavigation.current = href;
    setOpen(false);
  }

  function finishMenuClose(event: Event) {
    const href = pendingNavigation.current;
    if (!href) return; // Escape and dismiss still return focus to the trigger.
    event.preventDefault();
    pendingNavigation.current = null;
    // Wait for the modal focus trap and scroll lock to be removed first.
    requestAnimationFrame(() => {
      const destination = new URL(href, window.location.origin);
      const target = destination.pathname === window.location.pathname && destination.hash
        ? document.getElementById(decodeURIComponent(destination.hash.slice(1)))
        : null;
      if (target) {
        router.push(href, { scroll: false });
        const originalTabIndex = target.getAttribute("tabindex");
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
        target.addEventListener("blur", () => {
          if (originalTabIndex === null) target.removeAttribute("tabindex");
          else target.setAttribute("tabindex", originalTabIndex);
        }, { once: true });
        target.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
          block: "start",
        });
      } else {
        router.push(href);
      }
    });
  }
  return (
    <div className="flex shrink-0 items-center gap-4 md:gap-9">
      <nav className="hidden items-center gap-9 md:flex" aria-label="Primary">
        {LINKS.map((item) => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined} className="header-nav-link text-[13px] text-body transition-colors hover:text-foreground">{item.label}</Link>)}
      </nav>
      <a href={SITE.bookingUrl} target="_blank" rel="noopener noreferrer" className={`site-button header-booking ${pathname === "/" ? "hero-button hero-button-glass" : "site-button-dark"}`}><ButtonLabel>Book a call</ButtonLabel><ArrowUpRight aria-hidden="true" /></a>
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild><Button variant="ghost" className="header-menu-trigger size-11" aria-label="Open menu"><MenuIcon className="size-5" /></Button></SheetTrigger>
          <SheetContent side="right" className="w-80 max-w-[90vw] gap-0 p-0" onCloseAutoFocus={finishMenuClose}>
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <div className="flex items-center px-5 py-6"><Logo size="sm" /></div>
            <div className="hairline" />
            <nav className="flex flex-col px-5 py-5" aria-label="Mobile primary">
              {LINKS.map((item) => <Link key={item.href} href={item.href} onClick={(event) => selectMobileLink(event, item.href)} className="border-b border-border py-5 text-base">{item.label}</Link>)}
              <a href={SITE.bookingUrl} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className="site-button site-button-dark mt-7"><ButtonLabel>Book a call</ButtonLabel><ArrowUpRight aria-hidden="true" /></a>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
