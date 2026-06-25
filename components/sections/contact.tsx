import { ArrowUpRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";

export function Contact() {
  return (
    <section id="contact" className="relative z-10 bg-card">
      <div className="mx-auto max-w-6xl px-6 py-28 md:py-40">
        <Reveal className="max-w-3xl">
          <div className="eyebrow mb-4">Stage</div>
          <h2 className="font-serif text-5xl leading-[1.04] tracking-[-0.02em] text-foreground md:text-7xl">
            We&rsquo;re early. Talk to us.
          </h2>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            Apeiron Labs is a small founding team. If you&rsquo;re a
            researcher, engineer, or partner who cares about getting embodied
            intelligence right, we want to hear from you.
          </p>
          <p className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-foreground/55">
            We respond personally.
          </p>
        </Reveal>

        <div className="mt-12 flex flex-wrap items-center gap-4">
          <Button asChild size="lg">
            <a href="mailto:contact@apeironlabs.ai">
              Email the founders
              <ArrowUpRightIcon
                className="motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out group-hover/button:translate-x-0.5 group-hover/button:-translate-y-0.5"
                data-icon="inline-end"
              />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
