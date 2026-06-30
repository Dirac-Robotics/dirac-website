---
name: Color and accent usage
description: Palette values, terracotta frequency rules, and the cut list for Apeiron Labs
type: project
---

## Palette (confirmed correct, keep as-is)

Light:
- Background: #F5F1E8 (cream)
- Foreground: #1F1B16
- Card: #FBF8F0
- Primary (terracotta): #B85C3A
- Muted foreground: #6B6258
- Border: #E5DDC9

Dark:
- Background: #1A1612 (espresso)
- Foreground: #EDE7D6
- Card: #221D17
- Primary (terracotta): #D97757

Both terracotta values pass WCAG AA against their respective backgrounds. Do not lighten (loses contrast) or darken (loses warmth).

## Terracotta Frequency Rule

Max 4-6 deliberate instances per full page. Current page had 12+, which degrades it from accent to ambient texture.

**Keep terracotta on:**
- Hero h1 italic word (one use)
- Eyebrow class globally (small, sparse — acceptable)
- Primary buttons
- Focus rings / ring token

**Remove terracotta from:**
- Mission pillar icon backgrounds → `bg-foreground/8 text-foreground/60`
- Gyms vertical rule → `border-l border-foreground/20`
- Gyms bullet dots → `h-px w-3 bg-foreground/40` (short horizontal rule)
- Footer `●` dot → remove or `text-muted-foreground`
- Footer `hover:text-primary` on nav links → `hover:text-foreground`
- Italic emphasis in Mission h2, Models h2, Contact h2 → plain serif

## Grain Overlay

The `body::before` radial dot grain in globals.css: remove it. It adds procedural texture without earning it typographically. The typography is sufficient.
