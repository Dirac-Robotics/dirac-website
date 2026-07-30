/**
 * Section D. Credentials as prose, no headshots and no links, and deliberately
 * no grid: the old bordered cells left a dangling empty cell. This is the short
 * version of the blurb; About carries the full one.
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
          Founders from CMU, Microsoft, and frontier AI research labs, with
          experience building autonomous driving perception, GitHub Copilot,
          and 3D computer vision systems. We are building the physics layer
          that every robot will learn from.
        </p>
      </div>
    </section>
  );
}
