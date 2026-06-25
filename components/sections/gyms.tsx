import { Reveal } from "@/components/reveal";

const DOMAINS = [
  {
    eyebrow: "Domain · 01",
    title: "Manipulation",
    body: "Pick-and-place, articulated objects, contact-rich assembly.",
  },
  {
    eyebrow: "Domain · 02",
    title: "Locomotion",
    body: "Bipedal and quadrupedal control on irregular terrain.",
  },
  {
    eyebrow: "Domain · 03",
    title: "Navigation",
    body: "Indoor and outdoor goal-reaching under partial observability.",
  },
  {
    eyebrow: "Domain · 04",
    title: "Dexterous control",
    body: "In-hand reorientation and tool use with high-DoF end-effectors.",
  },
  {
    eyebrow: "Domain · 05",
    title: "Long-horizon planning",
    body: "Multi-stage tasks where each subgoal compounds the failure budget.",
  },
];

export function Gyms() {
  return (
    <section
      id="evaluation"
      className="relative z-10 border-b border-border/60 bg-background"
    >
      <div className="mx-auto max-w-6xl px-6 py-28 md:py-36">
        <div className="grid gap-16 md:grid-cols-[5fr_6fr] md:gap-24">
          <Reveal>
            <div className="eyebrow mb-4">Evaluation</div>
            <h2 className="font-serif text-4xl leading-[1.08] tracking-[-0.01em] text-foreground md:text-6xl">
              The benchmarks we wish existed.
            </h2>
            <div className="mt-8 space-y-5 text-base leading-relaxed text-muted-foreground md:text-lg">
              <p>
                Most robotics evaluations today are too narrow, too easy, or
                too easy to overfit to. Numbers go up; capability does not.
              </p>
              <p>
                We&rsquo;re building RL gyms that are diverse,
                contamination-resistant, and shared with the research
                community &mdash; the kind of benchmark our own models will
                have to clear before we ship anything.
              </p>
              <p className="font-mono text-sm uppercase tracking-[0.18em] text-foreground/70">
                No eval, no claim.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <ul className="border-l border-foreground/15 pl-9">
              {DOMAINS.map((d, i) => (
                <li
                  key={d.title}
                  className={
                    "relative " +
                    (i === DOMAINS.length - 1
                      ? "pt-0 pb-0"
                      : "pb-9")
                  }
                >
                  <span
                    aria-hidden
                    className="absolute -left-[2.55rem] top-3 h-px w-4 bg-foreground/40"
                  />
                  <div className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-primary/85">
                    {d.eyebrow}
                  </div>
                  <div className="mt-1 font-serif text-2xl leading-tight text-foreground md:text-[1.7rem]">
                    {d.title}
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground md:text-base">
                    {d.body}
                  </p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
