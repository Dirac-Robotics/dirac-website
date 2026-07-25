import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main id="content" className="relative flex flex-1 flex-col">
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-32 md:py-40">
        <div className="eyebrow mb-5">404</div>
        <h1 className="mb-8 max-w-[20ch] text-[2.75rem] leading-[1.05] tracking-[-0.02em] text-balance text-foreground md:text-[3.5rem]">
          We could not find that page.
        </h1>
        <p className="prose-body mb-12">
          The link may be broken, or the page may have moved.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <Link href="/">Return home</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
