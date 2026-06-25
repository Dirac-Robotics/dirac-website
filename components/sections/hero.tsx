import { ArrowRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";

export function Hero() {
  return (
    <section
      id="top"
      className="relative isolate border-b border-border/60"
    >
      <div className="mx-auto max-w-6xl px-6 pt-36 pb-44 md:pt-52 md:pb-60">
        <Reveal>
          <div className="eyebrow mb-8" style={{ color: "#6A6E7A", letterSpacing: "0.2em" }}>
            REAL2SIM PIPELINES
          </div>
          <h1 className="max-w-[20ch] font-serif text-[3rem] leading-[1.04] tracking-[-0.02em] text-balance text-foreground sm:text-[4rem] md:text-[5.5rem]">
            Close the sim-to-real gap
            <span style={{ color: "var(--white)" }}>.</span>
          </h1>
        </Reveal>

        <Reveal delay={0.06} className="mt-8">
          <p
            className="text-sm leading-relaxed tracking-[0.04em]"
            style={{ color: "#6A6E7A", fontFamily: "var(--font-dm-mono)" }}
          >
            Physics-accurate simulation from your real environment. Automated.
          </p>
        </Reveal>

        <div className="mt-10">
          <Button asChild size="lg">
            <a href="#contact">
              Request access
              <ArrowRightIcon
                className="opacity-80"
                data-icon="inline-end"
              />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
