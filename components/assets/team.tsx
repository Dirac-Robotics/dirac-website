/**
 * Section D. Collective credentials only. No names, no headshots, no links,
 * and deliberately no grid: the old bordered cells left a dangling empty cell.
 */
export function Team() {
  return (
    <section
      id="team"
      className="relative z-10 border-b border-border bg-background"
    >
      <div className="mx-auto max-w-6xl px-6 py-16 text-center md:py-20">
        <div className="eyebrow mb-4">The team</div>
        <p className="prose-body mx-auto">
          Engineers from CMU and Microsoft, with backgrounds in deep learning
          research and autonomous vehicle software. Founders who have shipped
          before.
        </p>
      </div>
    </section>
  );
}
