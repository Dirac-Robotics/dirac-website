import { Reveal } from "@/components/reveal";

export function Models() {
  return (
    <section
      id="statement"
      className="relative z-10 overflow-hidden border-b"
      style={{ backgroundColor: "var(--background)", borderColor: "var(--border)" }}
    >
      {/* Centered ambient glow */}
      <div
        className="glow-blob absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[700px]"
        style={{ background: "radial-gradient(ellipse at center, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.04) 50%, transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-32 md:py-48 flex items-center justify-center">
        <Reveal className="text-center">
          <p className="font-serif text-5xl leading-[1.04] tracking-[-0.03em] text-balance text-foreground md:text-7xl lg:text-8xl">
            Test where it ships.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
