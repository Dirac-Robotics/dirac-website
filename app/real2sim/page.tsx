import type { Metadata } from "next";

import { LeadForm } from "@/components/contact/lead-form";

export const metadata: Metadata = { title: "Real2Sim" };

export default function Real2SimPage() {
  return (
    <main id="content" className="relative flex-1">
      <section className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="eyebrow mb-6">Real2Sim</div>
        <h1 className="font-serif text-5xl leading-[1.03] tracking-[-0.03em] text-foreground md:text-7xl">
          Real2Sim pipelines.
        </h1>
        <p className="mt-6 max-w-[52ch] text-sm leading-relaxed text-muted-foreground md:text-base">
          Physics-accurate simulation reconstructed from your real environment.
          More detail is coming soon.
        </p>
      </section>

      <section className="border-t border-border bg-background">
        <div className="mx-auto max-w-2xl px-6 py-20">
          <div className="eyebrow mb-4">Get early access</div>
          <h2 className="mb-8 font-serif text-2xl text-foreground md:text-3xl">
            Tell us about your Real2Sim needs.
          </h2>
          <LeadForm
            variant="compact"
            presetInterest="real2sim"
            sourcePage="/real2sim"
          />
        </div>
      </section>
    </main>
  );
}
