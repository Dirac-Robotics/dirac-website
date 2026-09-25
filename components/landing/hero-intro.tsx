/** Runs in <head> while HTML is parsed, before either the page or React paints. */
export const HERO_INTRO_SCRIPT = `(() => {
  const root = document.documentElement;
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const navigation = performance.getEntriesByType("navigation")[0];
  let seen = false;
  try { seen = sessionStorage.getItem("dirac-hero-intro-seen") === "true"; } catch {}
  if (window.location.pathname !== "/" || window.location.hash || seen ||
      motion.matches || document.hidden || window.scrollY > 12 ||
      navigation?.type === "back_forward") return;

  const events = new AbortController();
  const finish = () => {
    root.dataset.heroIntro = "complete";
    window.clearTimeout(timeout);
    events.abort();
  };
  const timeout = window.setTimeout(finish, 1400);
  const options = { signal: events.signal, passive: true };
  window.addEventListener("pointerdown", finish, options);
  window.addEventListener("keydown", finish, options);
  window.addEventListener("scroll", () => { if (window.scrollY > 12) finish(); }, options);
  window.addEventListener("pagehide", finish, options);
  document.addEventListener("focusin", finish, options);
  document.addEventListener("visibilitychange", finish, options);
  motion.addEventListener("change", finish, options);
  root.dataset.heroIntro = "playing";
  try { sessionStorage.setItem("dirac-hero-intro-seen", "true"); } catch {}
})();`;

/** CSS completes the reveal even if the React bundle is delayed or fails. */
export function HeroIntro() {
  return (
    <div className="hero-intro" aria-hidden="true">
      <div className="hero-intro-lockup">
        {/* The transparent mark is extracted from the original Dirac artwork. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brands/dirac-mark.png" width="792" height="578" alt="" className="hero-intro-mark" />
        <span className="hero-intro-name">Dirac Robotics</span>
      </div>
    </div>
  );
}
