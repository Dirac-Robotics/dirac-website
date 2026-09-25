# Hero image restoration brief

Status: the user supplied a regenerated image, now installed in the hero.

## Supplied replacement

The user's `ChatGPT Image Sep 24, 2026, 07_08_51 PM.png` is 2073 × 759
pixels, with 72 PPI metadata. It was converted to the versioned asset
`public/media/robot-horizon-v3.webp` using lossless WebP. Decoded RGB pixels
were verified identical to the supplied PNG. No upscaling, sharpening, or
AI generation was performed locally.

The hero serves this file directly with Next Image's `unoptimized` option
to prevent a second lossy encoding or resolution reduction. Preloading,
layout, image positioning, animations, and responsive styling are preserved.
This is a sharper source image supplied by the user, not a native 4K or 8K
deliverable. The earlier assets remain available.

## Earlier source

The original is 2073 × 758 pixels. The earlier 4146 × 1516 asset is a
Lanczos upscale, so it retains the original's limited detail. DPI metadata
does not affect image sharpness on the website.

## Edit prompt

Use case: precise-object-edit
Asset type: full-screen website hero background
Input image: the original robot-horizon PNG, used as the edit target.
Primary request: reconstruct the same image at high resolution with crisp,
natural detail in the rover and foreground terrain. Preserve its composition.
Scene: a small wheeled exploration robot in the lower right on a dark curved
landscape, beneath the large luminous orange arc sweeping up to the top right.
Constraints: preserve the camera, perspective, rover silhouette and position,
wheel arrangement, sensor mast, horizon geometry, orange lighting, shadows,
dark navy palette, and broad dark negative space on the left for website text.
Sharpen meaningful physical detail without changing the soft atmospheric glow.
Avoid: new objects, extra wheels, text, logos, watermarks, reframing, palette
changes, artificial sharpening halos, oversaturated lighting, and plastic
terrain textures.

## Integration and review

- Create a native high-resolution edit, preserving the source aspect ratio
  as closely as the generator supports. Do not present interpolation or a DPI
  metadata change as recovered detail.
- Keep the existing source and create a new versioned image file.
- Compare composition and detail with the original before updating the hero.
- Preserve all layout, typography, color tokens, and responsive styling.
- Verify the actual delivered image resolution and full-screen crop at desktop
  and phone sizes.

The original plan required image generation, which was unavailable in this
session. The user subsequently authorized the API fallback, but no key was
configured and no API request ran. They generated the replacement in ChatGPT
and supplied the resulting image directly.
