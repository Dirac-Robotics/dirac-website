export type Spec = { label: string; value: string };

/**
 * Four-cell technical strip. Same visual treatment as the numbered step strip
 * on the Assets page (solid panel, hairline dividers, DM Mono) so the pages
 * read as one site. Label dim, value bright. Values are short noun phrases,
 * never sentences, which is what keeps DM Mono legitimate here.
 *
 * Labels stack above values rather than sitting beside them: at four columns
 * a label like RANDOMIZATION plus its value will not fit on one line.
 */
export function SpecStrip({ specs }: { specs: Spec[] }) {
  return (
    <div className="panel-solid border border-border">
      <dl className="grid grid-cols-2 md:grid-cols-4">
        {specs.map((s, i) => (
          <div
            key={s.label}
            className={[
              "flex flex-col gap-2 px-4 py-4",
              i < specs.length - 1 ? "md:border-r border-border" : "",
              i < 2 ? "border-b md:border-b-0 border-border" : "",
              i % 2 === 0 ? "border-r border-border" : "",
            ].join(" ")}
          >
            <dt className="data text-[0.6rem] uppercase text-dim">{s.label}</dt>
            <dd className="data text-[0.72rem] leading-[1.4] text-ash">
              {s.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
