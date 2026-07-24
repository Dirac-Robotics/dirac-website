const STEPS = [
  { n: "01", label: "Request" },
  { n: "02", label: "Vote" },
  { n: "03", label: "We build it" },
  { n: "04", label: "Top requester gets it free" },
];

/** The challenge mechanic, stated plainly. DM Mono, technical. */
export function ChallengeStrip() {
  return (
    <div className="border border-border">
      <ul className="grid grid-cols-2 md:grid-cols-4">
        {STEPS.map((s, i) => (
          <li
            key={s.n}
            className={[
              "flex items-center gap-3 px-4 py-4",
              i < STEPS.length - 1 ? "md:border-r border-border" : "",
              i < 2 ? "border-b md:border-b-0 border-border" : "",
              i === 0 ? "border-r md:border-r border-border" : "",
              i === 2 ? "border-r md:border-r border-border" : "",
            ].join(" ")}
          >
            <span className="mono text-[0.6rem] tracking-[0.16em] text-[var(--graphite)]">
              {s.n}
            </span>
            <span className="mono text-[0.72rem] uppercase tracking-[0.12em] text-ash">
              {s.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
