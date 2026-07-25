import type { LeadInterest } from "@/lib/validation";
import { LeadForm } from "@/components/contact/lead-form";

/**
 * Closing CTA. Every marketing page ends with one, on the same content grid as
 * everything above it, with the interest preset and the source page recorded.
 */
export function CtaSection({
  eyebrow = "Get started",
  headline,
  line,
  interest,
  sourcePage,
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
        {/* The form keeps a readable width inside the full content grid. */}
        <div className="mt-8 max-w-xl">
          <LeadForm
            variant="compact"
            presetInterest={interest}
            sourcePage={sourcePage}
          />
        </div>
      </div>
    </section>
  );
}
