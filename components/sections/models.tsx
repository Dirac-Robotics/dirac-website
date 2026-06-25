import { Card, CardContent } from "@/components/ui/card";
import { Reveal } from "@/components/reveal";

const THEMES = [
  {
    eyebrow: "01 / Pretrain",
    title: "Multi-embodiment foundations",
    body: "Pretraining across diverse robot morphologies and action spaces, so a single model transfers instead of being rebuilt for every platform.",
  },
  {
    eyebrow: "02 / Grounding",
    title: "Long-horizon action grounding",
    body: "Decomposing language goals into action sequences that hold up over minutes, not seconds — the regime where current robot policies tend to fall apart.",
  },
  {
    eyebrow: "03 / Release",
    title: "Open weights when ready",
    body: "We intend to release checkpoints under permissive licenses once they meet a bar we trust. Until then, we don't.",
  },
];

export function Models() {
  return (
    <section
      id="models"
      className="relative z-10 border-b border-border/60 bg-card"
    >
      <div className="mx-auto max-w-6xl px-6 py-28 md:py-36">
        <Reveal className="max-w-3xl">
          <div className="eyebrow mb-4">Models</div>
          <h2 className="font-serif text-4xl leading-[1.08] tracking-[-0.01em] text-foreground md:text-6xl">
            A family of VLA foundations &mdash; in development.
          </h2>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground">
            We are training vision-language-action models on heterogeneous
            embodied data. The first checkpoints are not public yet. What
            follows is the shape of the work, not a product page.
          </p>
        </Reveal>

        <Reveal delay={0.08} className="mt-16 grid gap-5 md:grid-cols-3">
          {THEMES.map((t) => (
            <Card
              key={t.eyebrow}
              className="bg-background ring-foreground/8 transition-colors"
            >
              <CardContent className="flex flex-col gap-5 py-3">
                <div className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-primary/85">
                  {t.eyebrow}
                </div>
                <h3 className="font-serif text-2xl leading-tight text-foreground md:text-[1.7rem]">
                  {t.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
