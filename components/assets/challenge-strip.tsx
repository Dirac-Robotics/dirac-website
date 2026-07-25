const STEPS = [
  { n: "01", label: "Request" },
  { n: "02", label: "Vote" },
  { n: "03", label: "We build it" },
  { n: "04", label: "Winner gets it free" },
];

/**
 * The challenge mechanic, stated plainly. Numbered data labels, so DM Mono is
 * correct here. Cells are equal-width grid tracks and stretch to a common
 * height, so no cell reads as accidentally taller than its neighbours.
 */
export function ChallengeStrip() {
  return (
    <div className="panel-solid border border-border">
      <ul className="grid grid-cols-2 md:grid-cols-4">
        {STEPS.map((s, i) => (
          <li
            key={s.n}
            className={[
              "flex items-center gap-2.5 px-3 py-3.5",
              i < STEPS.length - 1 ? "md:border-r border-border" : "",
              i < 2 ? "border-b md:border-b-0 border-border" : "",
              i === 0 || i === 2 ? "border-r border-border" : "",
            ].join(" ")}
          >
            <span className="data shrink-0 text-[0.6rem] text-dim">{s.n}</span>
            <span className="data text-[0.7rem] leading-[1.3] uppercase text-ash">
              {s.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
