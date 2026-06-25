---
name: Spacing and layout system
description: Section padding, max-widths, hero padding, and grid conventions for Apeiron Labs
type: project
---

## Layout Grid

- Max content width: max-w-6xl (1152px) — all sections
- Horizontal gutter: px-6 mobile and desktop (max-w does the work at wide viewports)
- Hero h1 max-width: max-w-[18ch] — forces intentional line break
- Body copy measure: max-w-[65ch] for longform paragraphs

## Section Padding

- Standard sections: py-24 md:py-32 (96px / 128px) — keep as-is
- Hero: pt-32 pb-40 md:pt-44 md:pb-52 (128/160px / 176/208px) — hero breathes more than other sections

## Section Background Alternation

Pattern: Hero (background) → Mission (card or background+border fix) → Models (card) → Gyms (background) → Contact (card).

Issue: Hero and Mission share bg-background with only a border-b border-border/60 between them — too subtle on light mode. Fix: either change Mission to bg-card, or change hero border to border-border (remove /60 opacity).

## Border Conventions

- Section dividers: border-b border-border/60
- Header at zero scroll: border-b border-foreground/8 (near-invisible, not transparent)
- Header at scroll: border-b border-border/60 with backdrop-blur
- Gyms vertical rule: border-l border-foreground/20 (not terracotta)
