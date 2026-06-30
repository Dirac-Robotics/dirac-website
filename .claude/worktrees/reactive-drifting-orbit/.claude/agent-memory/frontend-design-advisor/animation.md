---
name: Animation posture
description: Agreed animation posture for Apeiron Labs — restrained, CSS-only or client-effect, no scroll-fades
type: project
---

## Rule: Restrained posture. CSS transitions and one client-side typewriter only.

**Why:** The previous `whileInView` Framer Motion approach was removed by a prior author because of hydration mismatches, headless-capture invisibility (OG/SEO), and net-negative design value on a single-page editorial layout. Any scroll-reveal re-introduction must survive server-first render and headless capture with no hidden content.

**How to apply:**
- No Framer Motion `whileInView` or `AnimatePresence` tied to scroll entry.
- `Reveal` stays a passthrough; do not reactivate it for scroll fades.
- CSS `transition` on interactive states (hover, focus, scroll-state) is always safe — server-rendered, no hydration risk, respects `prefers-reduced-motion` via `@media (prefers-reduced-motion: reduce)`.
- Header scroll-state transition (`transition-all duration-300`) is the established model: already live, correct pattern.
- One acceptable client animation: hero eyebrow typewriter — `useEffect` that triggers after mount, starts from the fully-rendered string (visible at first paint), uses `@media (prefers-reduced-motion)` guard.
- DO NOT add: parallax, gradient blob, cursor glow, scroll-jacked transitions, marquee, count-up stats, magnetic buttons, hover-lift cards, animated gradients on headings.
