import type { Metadata } from "next";

import { SITE } from "@/lib/site";
import { LeadForm } from "@/components/contact/lead-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Talk to Dirac Robotics about Real2Sim, Evals, and asset packs.",
};

export default function ContactPage() {
  return (
    <main id="content" className="relative flex-1">
      <section className="mx-auto max-w-2xl px-6 py-20 md:py-28">
        <div className="eyebrow mb-4">Contact</div>
        <h1 className="mb-4 font-serif text-4xl leading-[1.05] tracking-[-0.02em] text-foreground md:text-5xl">
          Tell us what you are building.
        </h1>
        <p className="mb-10 max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
          Real2Sim pipelines, the Evals platform, or asset packs. Send a note and
          we will follow up. You can also{" "}
          <a
            href={SITE.calendlyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline underline-offset-4"
          >
            book a call
          </a>
          .
        </p>
        <LeadForm variant="full" sourcePage="/contact" />
      </section>
    </main>
  );
}
