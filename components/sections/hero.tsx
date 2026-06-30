import { ArrowRightIcon, CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";

const CALENDLY_URL = "https://calendly.com/9i-divyansh/15-min-catchup";

export function Hero() {
  return (
    <section
      id="top"
      className="relative isolate overflow-hidden border-b"
      style={{ borderColor: "var(--border)" }}
    >
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-grid" aria-hidden="true" />
      {/* Vignette to fade grid at edges */}
      <div className="absolute inset-0 bg-vignette" aria-hidden="true" />

      {/* Ambient glow — top center */}
      <div
        className="glow-blob absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[700px]"
        style={{ background: "radial-gradient(ellipse at center, rgba(99,102,241,0.14) 0%, rgba(139,92,246,0.06) 50%, transparent 70%)" }}
        aria-hidden="true"
      />
      {/* Secondary glow — offset left for depth */}
      <div
        className="glow-blob absolute top-1/2 -left-24 h-[400px] w-[400px]"
        style={{ background: "radial-gradient(ellipse at center, rgba(99,102,241,0.06) 0%, transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pt-40 pb-52 md:pt-56 md:pb-72">
        <Reveal>
          <div className="eyebrow mb-6">
            Real2Sim Pipelines
          </div>

          <h1 className="max-w-[18ch] font-serif text-[3.2rem] leading-[1.02] tracking-[-0.03em] text-balance text-foreground sm:text-[4.5rem] md:text-[6rem] lg:text-[7rem]">
            Close the sim-to-real gap.
          </h1>
        </Reveal>

        <Reveal delay={0.06} className="mt-7">
          <p
            className="max-w-[48ch] text-sm leading-relaxed tracking-[0.03em]"
            style={{ color: "#6A6E7A", fontFamily: "var(--font-dm-mono)" }}
          >
            Physics-accurate simulation from your real environment. Automated.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mt-10 flex flex-wrap gap-3">
          <Button asChild size="lg" className="gap-2">
            <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
              <CalendarIcon className="size-4 opacity-80" />
              Book a call
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#how-it-works">
              How it works
              <ArrowRightIcon className="opacity-70" data-icon="inline-end" />
            </a>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
