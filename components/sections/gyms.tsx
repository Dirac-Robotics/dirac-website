import { Reveal } from "@/components/reveal";

const TEAM = [
  { name: "Divyansh Chauhan", role: "CEO" },
  { name: "Harsha Bommana", role: "CAIO" },
];

export function Gyms() {
  return (
    <section
      id="team"
      className="relative z-10 border-b bg-background"
      style={{ borderColor: "#1A1E28" }}
    >
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <Reveal className="flex flex-wrap justify-center gap-5">
          {TEAM.map((member) => (
            <div
              key={member.name}
              className="flex flex-col items-center gap-3 rounded-lg border px-10 py-8"
              style={{ backgroundColor: "#1A1C24", borderColor: "#1A1E28" }}
            >
              <span className="font-serif text-xl leading-tight text-foreground md:text-2xl">
                {member.name}
              </span>
              <span
                className="text-[0.65rem] uppercase tracking-[0.2em]"
                style={{ fontFamily: "var(--font-dm-mono)", color: "#6A6E7A" }}
              >
                {member.role}
              </span>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
