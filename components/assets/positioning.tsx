/** Section C. Confident, technical positioning. No em dashes. */
export function Positioning() {
  return (
    <section
      id="positioning"
      className="relative z-10 border-b border-border bg-background"
    >
      <div className="mx-auto max-w-6xl px-6 py-16 text-center md:py-20">
        <h2 className="text-3xl leading-[1.1] text-foreground md:text-5xl">
          Physics-accurate, automatically.
        </h2>
        <p className="prose-body mx-auto mt-6">
          Most asset libraries ship whatever was convenient to scan and expect
          you to work around it. Geometry alone does not tell you how an object
          behaves when a gripper closes on it. Our Real2Sim and asset creation
          pipeline predicts the full physical behaviour of an object, not just
          its shape, so what you drop into Isaac Sim moves the way the real
          thing does.
        </p>
      </div>
    </section>
  );
}
