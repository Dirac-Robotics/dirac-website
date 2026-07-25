/**
 * Eyebrow + headline + standfirst. The top of every marketing page, so the
 * five pages share one content grid and one type scale rather than each
 * re-deciding. Fonts come from the tokens: the eyebrow is DM Mono, the
 * headline is Syne via the base h1 rule, the standfirst is body sans.
 */
export function PageHeader({
  eyebrow,
  headline,
  standfirst,
}: {
  eyebrow: string;
  headline: string;
  standfirst?: string;
}) {
  return (
    <header>
      <div className="eyebrow mb-5">{eyebrow}</div>
      <h1 className="max-w-[18ch] text-[2.5rem] leading-[1.05] tracking-[-0.03em] text-foreground sm:text-5xl lg:text-[3.5rem]">
        {headline}
      </h1>
      {standfirst ? (
        <p className="prose-standfirst mt-6">{standfirst}</p>
      ) : null}
    </header>
  );
}
