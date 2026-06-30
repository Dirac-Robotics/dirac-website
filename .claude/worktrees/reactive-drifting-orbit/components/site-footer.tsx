import { Wordmark } from "@/components/wordmark";

const CALENDLY_URL = "https://calendly.com/9i-divyansh/15-min-catchup";

export function SiteFooter() {
  return (
    <footer
      className="relative z-10 border-t"
      style={{ backgroundColor: "var(--background)", borderColor: "var(--border)" }}
    >
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <a href="#top" className="text-foreground">
            <Wordmark size="sm" />
          </a>

          <div className="flex items-center gap-6">
            <a
              href={CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[0.65rem] uppercase tracking-[0.2em] transition-colors hover:text-foreground"
              style={{ fontFamily: "var(--font-dm-mono)", color: "#6A6E7A" }}
            >
              Book a call
            </a>
            <a
              href="mailto:hello@diracrobotics.com"
              className="text-[0.65rem] uppercase tracking-[0.2em] transition-colors hover:text-foreground"
              style={{ fontFamily: "var(--font-dm-mono)", color: "#6A6E7A" }}
            >
              hello@diracrobotics.com
            </a>
          </div>
        </div>

        <div className="mt-8 rule-fade" />

        <div className="mt-6 flex items-center justify-between">
          <span
            className="text-[0.6rem] uppercase tracking-[0.2em]"
            style={{ fontFamily: "var(--font-dm-mono)", color: "#3A3D50" }}
          >
            © {new Date().getFullYear()} Dirac Robotics
          </span>
          <span
            className="text-[0.6rem] uppercase tracking-[0.2em]"
            style={{ fontFamily: "var(--font-dm-mono)", color: "#3A3D50" }}
          >
            diracrobotics.com
          </span>
        </div>
      </div>
    </footer>
  );
}
