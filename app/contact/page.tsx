import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";

import { SITE } from "@/lib/site";
import { PageHeader } from "@/components/marketing/page-header";
import { NodeMesh } from "@/components/marketing/node-mesh";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Contact",
  description: "Talk to Dirac Robotics about Real2Sim, Evals, and asset packs.",
};

export default function ContactPage() {
  return (
    <main id="content" className="relative flex-1">
      {/* Same content grid as every other page: no centred, offset column. */}
      <section className="relative isolate overflow-hidden mx-auto max-w-6xl px-6 py-16 md:py-24">
        <NodeMesh className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-1/2 lg:block" />
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

        <div className="mt-10">
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
      </section>
    </main>
  );
}
