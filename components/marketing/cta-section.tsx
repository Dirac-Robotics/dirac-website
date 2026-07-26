import { ArrowRight } from "lucide-react";

import type { LeadInterest } from "@/lib/validation";
import { SITE } from "@/lib/config/site";
import { Button } from "@/components/ui/button";

/**
 * Closing CTA. Every marketing page ends with one, on the same content grid as
 * everything above it, with the interest preset and the source page recorded.
 */
export function CtaSection({
  eyebrow = "Get started",
  headline,
  line,
}: {
  eyebrow?: string;
  headline: string;
  line: string;
  interest: LeadInterest;
  sourcePage: string;
}) {
  return (
    <section className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="eyebrow mb-4">{eyebrow}</div>
        <h2 className="max-w-[20ch] text-2xl leading-[1.15] text-foreground md:text-3xl">
          {headline}
        </h2>
        <p className="prose-body mt-4">{line}</p>
        <div className="mt-8">
          <Button
            asChild
            size="lg"
            className="h-12 gap-2 px-8 text-base font-semibold"
          >
            <a
              href={SITE.calendlyUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Book a call
              <ArrowRight className="size-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
