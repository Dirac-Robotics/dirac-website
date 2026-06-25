import { Reveal } from "@/components/reveal";

const PILLARS = [
  {
    index: "01",
    title: "Models",
    body: "Building foundation VLAs over multi-embodiment data.",
  },
  {
    index: "02",
    title: "Evaluation",
    body: "Building RL gyms across manipulation, navigation, and dexterous control.",
  },
  {
    index: "03",
    title: "Open ecosystem",
    body: "Releasing weights and gyms to the research community when they're ready.",
  },
];

export function Mission() {
  return (
    <section
      id="mission"
      className="relative z-10 border-b border-border/60 bg-background"
    >
      <div className="mx-auto max-w-6xl px-6 py-28 md:py-36">
        <Reveal>
          <div className="eyebrow mb-4">Mission</div>
          <h2 className="max-w-3xl font-serif text-4xl leading-[1.08] tracking-[-0.01em] text-foreground md:text-6xl">
            Robotic intelligence is a{" "}
            <span className="italic text-primary">model</span> problem.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-10 md:grid-cols-2 md:gap-20">
          <Reveal delay={0.04}>
            <p className="text-lg leading-relaxed text-foreground/85">
              We bet that general-purpose models trained on heterogeneous
              embodied data will outperform task-specific stacks across the
              widest set of real-world tasks &mdash; the same lesson that
              played out in language and vision, now playing out in robotics.
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="text-lg leading-relaxed text-foreground/85">
              We also believe most of the field measures the wrong things, so
              we build the benchmarks too. We do not build robots. We build
              the models that run on them, and the gyms that hold them
              honest.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.14} className="mt-20 border-t border-border/80">
          <ul>
            {PILLARS.map((p) => (
              <li
                key={p.title}
                className="grid grid-cols-1 gap-3 border-b border-border/80 py-7 md:grid-cols-[6rem_minmax(0,18rem)_1fr] md:items-baseline md:gap-10 md:py-9"
              >
                <span className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-primary/85">
                  {p.index}
                </span>
                <h3 className="font-serif text-3xl leading-tight text-foreground md:text-4xl">
                  {p.title}
                </h3>
                <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
                  {p.body}
                </p>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
