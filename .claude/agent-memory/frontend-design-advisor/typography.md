---
name: Typography decisions
description: Confirmed font stack, type scale, and tracking values for Apeiron Labs site
type: project
---

## Font Stack (decided May 2026)

- **Display/headings**: Instrument Serif (Google Fonts) — weight 400, normal + italic. Keep.
- **Body/sans**: IBM Plex Sans (Google Fonts) — weights 400, 500, 600. Replaces Geist Sans.
- **Mono/eyebrows**: IBM Plex Mono (Google Fonts) — weights 400, 500. Replaces Geist Mono.

**Why IBM Plex over Geist:** Geist reads startup; Plex reads research institution. Plex Sans + Instrument Serif have strong optical compatibility (structured grotesque + classical serif). Plex Mono shares rhythm with Plex Sans, so eyebrows sit naturally alongside body.

CSS variables in globals.css:
```css
--font-sans: var(--font-plex-sans);
--font-mono: var(--font-plex-mono);
--font-serif: var(--font-instrument-serif);
```

## Type Scale

| Role | Size | Line-height | Tracking | Font |
|---|---|---|---|---|
| Hero h1 | 4.5rem / md:6rem | 1.04 | -0.02em | Instrument Serif |
| Section h2 | 2.75rem / md:3.5rem | 1.08 | -0.015em | Instrument Serif |
| Contact h2 | 3rem / md:4.5rem | 1.06 | -0.02em | Instrument Serif |
| Eyebrow | 0.7rem | 1 | 0.16em | IBM Plex Mono, uppercase |
| Body large | 1.125rem | 1.7 | 0 | IBM Plex Sans |
| Body | 1rem | 1.65 | 0 | IBM Plex Sans |
| Caption/meta | 0.75rem | 1.5 | 0 | IBM Plex Mono |

## Italic-Terracotta Device

Maximum 2 uses per page total. Hero h1 earns one. One more anywhere — that's the budget. All other headings: plain Instrument Serif, no italic, no color override.
