import type { Metadata } from "next";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <main id="content" className="relative flex-1">
      <section className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="eyebrow mb-6">About</div>
        <h1 className="font-serif text-5xl leading-[1.03] tracking-[-0.03em] text-foreground md:text-7xl">
          About Dirac.
        </h1>
        <p className="mt-6 max-w-[52ch] text-sm leading-relaxed text-muted-foreground md:text-base">
          We build measured-physics simulation assets for robotics. More detail
          is coming soon.
        </p>
      </section>
    </main>
  );
}
