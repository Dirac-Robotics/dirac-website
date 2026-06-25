"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";

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
        "sticky top-0 z-40 w-full transition-all duration-200",
        scrolled
          ? "border-b bg-background/90 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      )}
      style={scrolled ? { borderColor: "#1A1E28" } : undefined}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a
          href="#top"
          className="rounded-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <Wordmark size="sm" />
        </a>

        <Button asChild size="sm" variant={scrolled ? "default" : "outline"}>
          <a href="#contact">Request access</a>
        </Button>
      </div>
    </header>
  );
}
