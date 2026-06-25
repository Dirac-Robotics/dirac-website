---
name: Component patterns
description: Section-by-section design decisions and component patterns for Apeiron Labs
type: project
---

## Hero

- Delete HeroGrid component and its wrapper div. Delete the file hero-grid.tsx.
- Delete the radial dot grain (body::before) from globals.css.
- Add a thin 16px rule above the eyebrow: `<div className="mb-8 h-px w-16 bg-primary/60" />`
- Replace inline Stat/Divider row with a specimen metadata strip (grid, 4 columns on desktop):
  - MetaItem component: label (mono caps, muted) + value (foreground/80)
  - Columns: Founded / Focus / Stage / Hardware
  - Strip sits below CTA buttons, separated by border-t border-border/50 pt-6
- Hero h1: max-w-[18ch], size 4.5rem/6rem, tracking -0.02em

## Mission Pillars

Replace shadcn Card grid with a ruled divide-y list:
- Grid: `grid-cols-[3rem_1fr]` mobile, `grid-cols-[4rem_16rem_1fr]` md
- Columns: index number (mono, muted) / title (serif, xl) / body (sm, muted-foreground)
- py-8 per row, divide-y divide-border between rows
- Remove lucide icons entirely. Remove icon backgrounds.

## Models Cards

- Keep the bg-background cards inside bg-card section (inversion = subtle depth, works)
- Keep mono eyebrow numbering (01 / Pretrain etc) — strong pattern
- Remove italic-terracotta from section h2

## Gyms (Evaluation)

- Keep editorial-left + vertical-list-right layout (strongest section)
- Vertical rule: change from border-l-2 border-primary/70 → border-l border-foreground/20
- Bullet dots: change from h-2 w-2 rounded-full bg-primary → h-px w-3 bg-foreground/40

## Contact

- Remove italic-terracotta from h2 "Talk to us." — plain serif reads more confident
- Remove bare email span next to button
- Add secondary mono paragraph below button describing who should reach out

## Footer

- Remove hover:text-primary on nav links → hover:text-foreground
- Remove or neutralize the `● in development` status line (undermines Contact section confidence)
- Keep three-column grid structure

## Header

- Add border-b border-foreground/8 at zero-scroll state (remove full transparency)
- After IBM Plex font swap: verify logo baseline alignment (Plex vs Geist cap height differ)
- No structural changes needed

## Reveal Component

- Remove Reveal from body copy and secondary elements
- Keep one Reveal per section on the section heading only
- Reduce stagger delays if keeping (current 0.05–0.28 is too theatrical)
- Or remove entirely — page should feel immediate, not performed

## Skip Link (missing — add this)

In layout.tsx, first child inside body:
```tsx
<a href="#top" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:text-foreground focus:shadow-md">
  Skip to content
</a>
```
