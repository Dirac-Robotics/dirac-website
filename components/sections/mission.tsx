import { Reveal } from "@/components/reveal";

const STEPS = [
  { index: "01", title: "Physics-accurate simulation" },
  { index: "02", title: "Automated tasks and scene randomization" },
  { index: "03", title: "Evaluation on your real scene" },
];

export function Mission() {
  return (
    <section
      id="how-it-works"
      className="relative z-10 border-b bg-background"
      style={{ borderColor: "#1A1E28" }}
    >
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <Reveal>
          <ul className="border-t" style={{ borderColor: "#1A1E28" }}>
            {STEPS.map((step) => (
              <li
                key={step.index}
                className="grid grid-cols-1 gap-4 border-b py-8 md:grid-cols-[5rem_1fr] md:items-baseline md:gap-12 md:py-10"
                style={{ borderColor: "#1A1E28" }}
              >
                <span
                  className="text-[0.65rem] uppercase tracking-[0.22em]"
                  style={{ fontFamily: "var(--font-dm-mono)", color: "#2E3040" }}
                >
                  {step.index}
                </span>
                <h3 className="font-serif text-2xl leading-tight text-foreground md:text-3xl">
                  {step.title}
                </h3>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
