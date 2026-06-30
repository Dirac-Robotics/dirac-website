"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";

const CALENDLY_URL = "https://calendly.com/9i-divyansh/15-min-catchup";

export function SiteHeader() {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        scrolled
          ? "border-b backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      )}
      style={
        scrolled
          ? { borderColor: "var(--border)", backgroundColor: "rgba(5,5,8,0.85)" }
          : undefined
      }
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a
          href="#top"
          className="rounded-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <Wordmark size="sm" />
        </a>

        <nav className="flex items-center gap-4">
          <a
            href="#how-it-works"
            className="hidden sm:block text-[0.72rem] uppercase tracking-[0.18em] transition-colors"
            style={{ fontFamily: "var(--font-dm-mono)", color: "#6A6E7A" }}
          >
            How it works
          </a>
          <a
            href="#team"
            className="hidden sm:block text-[0.72rem] uppercase tracking-[0.18em] transition-colors"
            style={{ fontFamily: "var(--font-dm-mono)", color: "#6A6E7A" }}
          >
            Team
          </a>
          <Button asChild size="sm" variant={scrolled ? "default" : "outline"}>
            <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
              Book a call
            </a>
          </Button>
        </nav>
      </div>
    </header>
  );
}
