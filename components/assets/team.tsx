const CREDENTIALS = [
  "CMU background",
  "Ex-Microsoft engineering. Developer tooling and AI products at scale",
  "Deep learning research, including brain-inspired AI",
  "Autonomous vehicle software experience",
  "Prior founders. Multiple companies shipped",
];

/** Section D. Collective credentials only. No names, no headshots, no bios. */
export function Team() {
  return (
    <section
      id="team"
      className="relative z-10 border-b border-border bg-background"
    >
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="eyebrow mb-10">The team</div>
        <ul className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {CREDENTIALS.map((c) => (
            <li
              key={c}
              className="bg-background px-6 py-8 mono text-[0.8rem] leading-relaxed tracking-[0.02em] text-ash"
            >
              {c}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
