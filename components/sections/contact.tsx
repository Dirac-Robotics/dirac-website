import { ArrowRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";

export function Contact() {
  return (
    <section
      id="contact"
      className="relative z-10"
      style={{ backgroundColor: "#0D0F14" }}
    >
      <div className="mx-auto max-w-6xl px-6 py-28 md:py-40 text-center">
        <Reveal>
          <h2 className="font-serif text-4xl leading-tight tracking-[-0.02em] text-foreground md:text-6xl">
            Request access.
          </h2>
          <div className="mt-10 flex justify-center">
            <Button asChild size="lg">
              <a href="mailto:hello@diracrobotics.com">
                Request access
                <ArrowRightIcon
                  className="opacity-80"
                  data-icon="inline-end"
                />
              </a>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
