import { ArrowRightIcon, CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";

const CALENDLY_URL = "https://calendly.com/9i-divyansh/15-min-catchup";

export function Contact() {
  return (
    <section
      id="contact"
      className="relative z-10 overflow-hidden"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Ambient glow */}
      <div
        className="glow-blob absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[900px]"
        style={{ background: "radial-gradient(ellipse at center, rgba(99,102,241,0.11) 0%, rgba(139,92,246,0.05) 50%, transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-4xl px-6 py-32 md:py-52 text-center">
        <Reveal>
          <div className="eyebrow mb-6 justify-center flex">Get started</div>

          <h2 className="font-serif text-4xl leading-[1.06] tracking-[-0.03em] text-foreground md:text-6xl lg:text-7xl">
            Ready to close<br className="hidden sm:block" /> the gap?
          </h2>

          <p
            className="mt-6 text-sm leading-relaxed tracking-[0.03em] mx-auto max-w-[44ch]"
            style={{ color: "#6A6E7A", fontFamily: "var(--font-dm-mono)" }}
          >
            Schedule a 30-minute call with us to see how Dirac can accelerate
            your robotics deployment.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="gap-2">
              <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                <CalendarIcon className="size-4 opacity-80" />
                Book a call
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="mailto:hello@diracrobotics.com">
                Email us
                <ArrowRightIcon className="opacity-70" data-icon="inline-end" />
              </a>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
