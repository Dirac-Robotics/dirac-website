"use client";

import * as React from "react";
import { MenuIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Wordmark } from "@/components/wordmark";

const NAV: { label: string; href: string; id: string }[] = [
  { label: "Mission", href: "#mission", id: "mission" },
  { label: "Models", href: "#models", id: "models" },
  { label: "Evaluation", href: "#evaluation", id: "evaluation" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = React.useState(false);
  const [active, setActive] = React.useState<string | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );
    for (const item of NAV) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-200",
        scrolled
          ? "border-b border-border/60 bg-background/90 backdrop-blur-md"
          : "border-b border-foreground/[0.08] bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a
          href="#top"
          className="rounded-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <Wordmark size="sm" />
        </a>

        <nav className="hidden md:flex items-center gap-6">
          {NAV.map((item) => {
            const isActive = active === item.id;
            return (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm underline decoration-transparent decoration-[1.5px] underline-offset-[6px] transition-colors duration-200",
                  isActive
                    ? "text-foreground decoration-primary/70"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            asChild
            size="sm"
            variant={scrolled ? "default" : "outline"}
            className="hidden md:inline-flex"
          >
            <a href="#contact">Get in touch</a>
          </Button>

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="md:hidden"
                aria-label="Open menu"
                aria-expanded={menuOpen}
              >
                <MenuIcon />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[calc(100vw-3rem)] max-w-xs p-6"
            >
              <SheetTitle className="sr-only">Site navigation</SheetTitle>
              <SheetDescription className="sr-only">
                Links to the main sections of the page.
              </SheetDescription>
              <div className="mt-2 flex flex-col gap-1">
                {NAV.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <a
                      href={item.href}
                      className="rounded-md px-3 py-3 font-serif text-2xl leading-tight text-foreground hover:bg-muted"
                    >
                      {item.label}
                    </a>
                  </SheetClose>
                ))}
                <SheetClose asChild>
                  <Button asChild className="mt-4 w-full">
                    <a href="#contact">Get in touch</a>
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
