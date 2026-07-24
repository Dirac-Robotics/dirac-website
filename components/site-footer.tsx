import Link from "next/link";

import { SITE } from "@/lib/site";
import { Logo } from "@/components/logo";

const linkClass =
  "mono text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground";

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="text-foreground" aria-label="Home">
            <Logo size="sm" />
          </Link>
          <div className="flex flex-wrap items-center gap-6">
            <a
              href={SITE.calendlyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              Book a call
            </a>
            <a href={`mailto:${SITE.contactEmail}`} className={linkClass}>
              {SITE.contactEmail}
            </a>
            <Link href="/contact" className={linkClass}>
              Contact
            </Link>
          </div>
        </div>

        <div className="mt-8 hairline" />

        <div className="mt-6 flex items-center justify-between">
          <span className="mono text-[0.6rem] uppercase tracking-[0.2em] text-[var(--graphite)]">
            © {new Date().getFullYear()} {SITE.name}
          </span>
          <span className="mono text-[0.6rem] uppercase tracking-[0.2em] text-[var(--graphite)]">
            {SITE.domain}
          </span>
        </div>
      </div>
    </footer>
  );
}
