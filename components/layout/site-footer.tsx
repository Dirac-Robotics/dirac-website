import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SITE } from "@/lib/config/site";
import { Logo } from "@/components/layout/logo";

const linkClass = "text-[13px] text-body transition-colors hover:text-foreground";

export function SiteFooter() {
  return (
    <footer className="relative border-t border-border bg-background">
      <div className="site-container py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-[1fr_auto]">
          <div><Link href="/" aria-label="Dirac Robotics home"><Logo size="md" /></Link></div>
          <div className="flex flex-wrap gap-x-12 gap-y-6 md:gap-x-20">
            <div className="flex flex-col gap-4"><span className="eyebrow mb-1">Explore</span><Link href="/#how-it-works" className={linkClass}>How it works</Link><Link href="/asset-pack" className={linkClass}>Explore assets</Link></div>
            <div className="flex flex-col gap-4"><span className="eyebrow mb-1">Get in touch</span><a href={SITE.bookingUrl} target="_blank" rel="noopener noreferrer" className={`${linkClass} inline-flex items-center gap-2`}>Book a call <ArrowUpRight className="size-3.5" aria-hidden="true" /></a><a href={`mailto:${SITE.contactEmail}`} className={linkClass}>{SITE.contactEmail}</a></div>
          </div>
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6"><span className="data text-[9px] uppercase text-dim">© {new Date().getFullYear()} {SITE.name}</span><span className="data text-[9px] uppercase text-dim">Model. Train. Test. Deploy.</span></div>
      </div>
    </footer>
  );
}
