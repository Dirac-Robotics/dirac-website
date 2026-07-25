import type { Metadata } from "next";

import { SITE } from "@/lib/site";
import { PageHeader } from "@/components/marketing/page-header";
import { LeadForm } from "@/components/contact/lead-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Talk to Dirac Robotics about Real2Sim, Evals, and asset packs.",
};

export default function ContactPage() {
  return (
    <main id="content" className="relative flex-1">
      {/* Same content grid as every other page: no centred, offset column. */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <PageHeader
          eyebrow="Contact"
          headline="Tell us where your robot works."
        />
        {/* Standfirst is composed here rather than passed in: it carries a link. */}
        <p className="prose-standfirst mt-6">
          Real2Sim, Evals, asset packs, or something adjacent. Send us the site
          and the task, and we will tell you what we can do and how fast. You
          can also{" "}
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

        <div className="mt-12 max-w-xl">
          <LeadForm variant="full" sourcePage="/contact" />
        </div>
      </section>
    </main>
  );
}
