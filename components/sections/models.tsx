import { Reveal } from "@/components/reveal";

export function Models() {
  return (
    <section
      id="statement"
      className="relative z-10 border-b"
      style={{ backgroundColor: "#0D0F14", borderColor: "#1A1E28" }}
    >
      <div className="mx-auto max-w-6xl px-6 py-28 md:py-40 flex items-center justify-center">
        <Reveal className="text-center">
          <p className="font-serif text-4xl leading-tight tracking-[-0.01em] text-foreground md:text-6xl lg:text-7xl">
            Test where it ships.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
