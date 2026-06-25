import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="relative flex flex-1 flex-col">
        <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-32 md:py-40">
          <Reveal>
            <div className="eyebrow mb-5">404</div>
            <h1 className="mb-8 max-w-[20ch] font-serif text-[2.75rem] leading-[1.05] tracking-[-0.02em] text-balance text-foreground md:text-[3.5rem]">
              We could not find that page.
            </h1>
            <p className="mb-12 max-w-[48ch] text-base leading-relaxed text-muted-foreground">
              The link may be broken, or the page may have moved.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/">Return home</Link>
              </Button>
            </div>
          </Reveal>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
