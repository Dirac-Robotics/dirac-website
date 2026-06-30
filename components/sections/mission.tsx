import { Reveal } from "@/components/reveal";

const STEPS = [
  {
    index: "01",
    title: "Physics-accurate simulation",
    description: "We reconstruct your real environment into a high-fidelity physics sim — geometry, materials, and dynamics included.",
  },
  {
    index: "02",
    title: "Automated tasks and scene randomization",
    description: "Tasks and domain randomization are generated automatically so your policy trains on the full distribution of real-world variation.",
  },
  {
    index: "03",
    title: "Evaluation on your real scene",
    description: "Policies are benchmarked against ground-truth hardware data, closing the loop between simulation and deployment.",
  },
];

export function Mission() {
  return (
    <section
      id="how-it-works"
      className="relative z-10 border-b"
      style={{ backgroundColor: "var(--background)", borderColor: "var(--border)" }}
    >
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-36">
        <Reveal>
          <div className="eyebrow mb-12">How it works</div>
        </Reveal>

        <Reveal>
          <div className="rule-fade" />
          <ul>
            {STEPS.map((step) => (
              <li
                key={step.index}
                className="grid grid-cols-1 gap-6 py-10 md:grid-cols-[6rem_1fr_2fr] md:items-start md:gap-16 md:py-12"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <span
                  className="text-[0.62rem] uppercase tracking-[0.22em] pt-1"
                  style={{ fontFamily: "var(--font-dm-mono)", color: "rgba(99,102,241,0.6)" }}
                >
                  {step.index}
                </span>
                <h3 className="font-serif text-2xl leading-tight text-foreground md:text-3xl">
                  {step.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "#6A6E7A", fontFamily: "var(--font-dm-mono)" }}
                >
                  {step.description}
                </p>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
