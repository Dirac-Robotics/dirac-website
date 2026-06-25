import { Wordmark } from "@/components/wordmark";

export function SiteFooter() {
  return (
    <footer
      className="relative z-10 border-t bg-background"
      style={{ borderColor: "#1A1E28" }}
    >
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex items-center justify-between">
          <a href="#top" className="text-foreground">
            <Wordmark size="sm" />
          </a>
          <span
            className="text-[0.65rem] uppercase tracking-[0.2em]"
            style={{ fontFamily: "var(--font-dm-mono)", color: "#6A6E7A" }}
          >
            diracrobotics.com
          </span>
        </div>
      </div>
    </footer>
  );
}
