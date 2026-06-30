import { Reveal } from "@/components/reveal";

const TEAM = [
  { name: "Divyansh Chauhan", role: "CEO" },
  { name: "Harsha Bommana", role: "CTO" },
];

export function Gyms() {
  return (
    <section
      id="team"
      className="relative z-10 overflow-hidden border-b"
      style={{ backgroundColor: "var(--background)", borderColor: "var(--border)" }}
    >
      {/* Subtle glow */}
      <div
        className="glow-blob absolute bottom-0 right-0 h-[400px] w-[500px]"
        style={{ background: "radial-gradient(ellipse at bottom right, rgba(99,102,241,0.07) 0%, transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-24 md:py-36">
        <Reveal>
          <div className="eyebrow mb-12">The team</div>
        </Reveal>

        <Reveal className="flex flex-wrap justify-start gap-5">
          {TEAM.map((member) => (
            <div
              key={member.name}
              className="card-glow flex flex-col gap-4 rounded-xl px-10 py-9 min-w-[220px]"
            >
              {/* Avatar circle */}
              <div
                className="size-10 rounded-full"
                style={{
                  background: "linear-gradient(135deg, rgba(99,102,241,0.3) 0%, rgba(139,92,246,0.15) 100%)",
                  border: "1px solid rgba(99,102,241,0.2)",
                }}
              />
              <div className="flex flex-col gap-1.5">
                <span className="font-serif text-xl leading-tight text-foreground md:text-2xl">
                  {member.name}
                </span>
                <span
                  className="text-[0.62rem] uppercase tracking-[0.22em]"
                  style={{ fontFamily: "var(--font-dm-mono)", color: "#6A6E7A" }}
                >
                  {member.role}
                </span>
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
