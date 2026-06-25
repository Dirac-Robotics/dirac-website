import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/wordmark";

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr]">
          <div className="space-y-3">
            <a href="#top" className="text-foreground">
              <Wordmark size="md" />
            </a>
            <p className="max-w-xs text-sm text-muted-foreground">
              Foundation models for embodied intelligence.
            </p>
          </div>

          <FooterColumn
            label="Site"
            links={[
              { label: "Mission", href: "#mission" },
              { label: "Models", href: "#models" },
              { label: "Evaluation", href: "#evaluation" },
            ]}
          />
          <FooterColumn
            label="Company"
            links={[
              { label: "Contact", href: "mailto:contact@apeironlabs.ai" },
            ]}
          />
        </div>

        <Separator className="my-10" />

        <div className="flex flex-col-reverse gap-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Apeiron Labs.</span>
          <div className="flex items-center gap-4">
            <span className="font-mono uppercase tracking-[0.2em] text-foreground/45">
              Prototype build · 2026
            </span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  label,
  links,
}: {
  label: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div className="space-y-3">
      <div className="eyebrow">{label}</div>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <a
              href={l.href}
              className="text-sm text-foreground/85 transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
