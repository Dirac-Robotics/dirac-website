import { ArrowRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { Wordmark } from "@/components/wordmark";

const META = [
  { label: "Stage", value: "Founding team" },
  { label: "Focus", value: "VLA foundations · RL gyms" },
  { label: "Hardware", value: "None, by design" },
];

export function Hero() {
  return (
    <section
      id="top"
      className="relative isolate border-b border-border/60"
    >
      <div className="mx-auto max-w-6xl px-6 pt-32 pb-40 md:pt-44 md:pb-52">
        <Reveal>
          <div className="mb-7 h-px w-16 bg-primary/70" aria-hidden />
          <Wordmark size="sm" className="mb-6" />
          <h1 className="max-w-[16ch] font-serif text-[3.25rem] leading-[1.02] tracking-[-0.02em] text-balance text-foreground sm:text-[4.5rem] md:max-w-[18ch] md:text-[5.5rem]">
            Foundation models for{" "}
            <span className="italic text-primary">embodied intelligence</span>.
          </h1>
        </Reveal>

        <Reveal delay={0.06} className="mt-10 max-w-2xl">
          <p className="text-lg leading-relaxed text-muted-foreground md:text-xl">
            We train vision-language-action models for general-purpose
            robotics, and the RL gyms that make them measurably better.
            Model-first.
          </p>
        </Reveal>

        <div className="mt-12 flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <a href="#models">
              See what we&apos;re building
              <ArrowRightIcon
                className="opacity-80 motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out group-hover/button:translate-x-0.5"
                data-icon="inline-end"
              />
            </a>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <a href="#mission">Read the mission</a>
          </Button>
        </div>

        <div className="mt-24 grid gap-x-12 gap-y-4 border-t border-border/60 pt-8 sm:grid-cols-3">
          {META.map((m) => (
            <MetaItem key={m.label} label={m.label} value={m.value} />
          ))}
        </div>
      </div>
    </section>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-primary/85">
        {label}
      </span>
      <span className="text-sm text-foreground/85">{value}</span>
    </div>
  );
}
