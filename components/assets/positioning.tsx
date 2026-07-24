/** Section C. Confident, technical positioning. No em dashes. */
export function Positioning() {
  return (
    <section
      id="positioning"
      className="relative z-10 border-b border-border bg-background"
    >
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="eyebrow mb-8">Positioning</div>
        <div className="max-w-4xl">
          <h2 className="font-serif text-3xl leading-[1.1] tracking-[-0.02em] text-foreground md:text-5xl">
            We build the assets people actually asked for, with physics we
            measured rather than guessed.
          </h2>
          <p className="mt-8 max-w-[64ch] text-sm leading-relaxed text-muted-foreground md:text-base">
            The industry has been shipping asset libraries built around whatever
            was convenient to scan, and telling people to work around them. We do
            the opposite. Whatever your workflow needs is what you get, measured
            to real hardware with stated uncertainty on every value.
          </p>
        </div>
      </div>
    </section>
  );
}
