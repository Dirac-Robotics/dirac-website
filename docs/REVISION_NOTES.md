# Website review changes

## Stable hero and continuous affiliation strip

- The hero photograph is anchored instead of moving with pointer and scroll
  offsets. This removes the snap when the cursor crosses the hero boundary
  or the user scrolls back from the rollout section, without changing its crop.
- Removed the affiliation pause button and hover-to-pause behavior. The strip
  scrolls continuously while visible; reduced-motion preferences still show a
  static list, and hidden/offscreen animation remains suspended.
- Browser review confirmed identical hero transforms and positions before and
  after crossing the section boundary and scrolling away/back. The affiliation
  animation remained running while hovered. Asset-page navigation and return
  were also checked.
- Final pre-PR checks passed: 12 focused validation/timeline tests and 57
  synthetic upload/admin integration checks using isolated Postgres/Azurite.

## User-supplied hero replacement

- Replaced the earlier enlarged hero image with the user's newly generated
  robot-horizon image. Its actual resolution is 2073 × 759 pixels.
- The new `public/media/robot-horizon-v3.webp` is lossless and has identical
  decoded RGB pixels to the supplied PNG. It is served directly to preserve
  source detail, without additional lossy encoding or resizing.
- Hero layout, responsive positioning, typography, colors, and animations
  are unchanged. The previous image files remain available.
- Production build passed, including TypeScript validation and 23 pages.
  Desktop and 390px phone crops were inspected in the browser. The phone
  preview loaded the full 2073 × 759 source with no horizontal page overflow.

## Mobile and tablet typography

- Responsive changes are limited to widths below 1024px. Desktop styles are
  unchanged, and before/after desktop geometry and typography matched.
- Hero, section and asset headings scale smoothly with viewport width.
  Phone gutters, line spacing, buttons, backers and footer links stay readable.
- Simulation chapters reserve enough space for their longest text, preventing
  overlap during transitions. Navigation fits short landscape viewports.
- The sample form uses a single column on phones and 16px inputs on phones
  and tablets to avoid iPhone focus zoom. Asset tabs retain readable labels
  and scroll horizontally on narrow screens.
- Browser checks covered widths from 320px through 1024px, including 320×568
  portrait and 844×390 landscape. No horizontal text overflow was found.
  Mobile forms and asset specifications were visually reviewed; the tablet
  asset title was checked at 768px. These were CSS viewport checks, not tests
  on physical devices.
- Typecheck and production build passed (23 pages). Lint had no errors and
  retains the existing unused `_userId` warning. The local preview was
  restarted to clear stale development CSS. No form submission or production
  operation was performed.

## Full-screen hero, opening reveal, and lighter assets

- The hero fills at least the viewport, with the original image continuing
  behind the affiliation row. Mobile framing keeps the robot visible at
  390px and 320px. The affiliation fallback keeps its height before hydration.
- The full hero heading reads “Reduce robot deployment time by 5× with
  simulations.” The last phrase shares the heading's font, size and line
  spacing, with orange as its only distinction. The earlier separate paragraph
  and underline were removed following the user's review.
- Hero and home-header buttons use a 320ms horizontal orange fill with stable
  labels and a glass/corner treatment for secondary actions. Invariant's live
  hero and public styles informed this treatment; letter scrambling was omitted
  to retain the user's preference for quiet text.
- A 1.3-second opening reveal uses a transparent extraction of the existing
  Dirac emblem. It plays once per tab session, skips deep links and reduced
  motion, and dismisses on input, scrolling, resizing, focus or visibility
  changes. It does not lock scrolling or delay navigation.
- The asset gallery now contains a short title, one short subline, a CTA, and
  visual cards with names and essential dimensions/mass. Version/beta labels
  and repeated explanations were removed. Detailed descriptions and evidence
  remain in the asset detail tabs; access behavior is unchanged.

### Hero image provenance and delivery

The prior 2073 × 758 WebP was 81 KB. Its source is the user's original PNG,
`codex-clipboard-6e5684a7-f747-499a-b728-6dd5e8ca20bc.png`, at the same dimensions.
The new `public/media/robot-horizon-4k-v2.webp` is a 4146 × 1516 Lanczos3 upscale
of that PNG, stored losslessly. This preserves composition and colors; it is
not AI regeneration or newly recovered scene detail. No DPI-only change was
used. The original WebP remains available.

Responsive image sizing now accounts for `object-fit: cover` cropping, and
Next serves quality-95 variants up to the full 4146px width. The largest served
WebP was verified at 362 KB. A new filename avoids the old immutable cache.

### Verification

- Typecheck, lint and production build passed (23 pages). The existing unused
  `_userId` lint warning remains. A stale generated duplicate type file was
  cleared by Next's normal production build regeneration.
- Desktop hero, button keyboard focus/fill, asset gallery, detail preview and
  Files tab were inspected in the browser. The opening reveal was captured
  while forming and verified to complete; revisits skip it.
- Browser viewport overrides had no effect, so isolated local iframe fixtures
  were used for real 390px and 320px CSS viewports. Hero and asset layouts were
  inspected with no horizontal page overflow. Reduced-motion behavior was
  code-reviewed.
- Local HTTP checks verified fresh styles and the full-resolution image.
  No production deployment, remote database operation, or form submission ran.

## Consistent color palette

- The interface uses one orange, `--orange: #ff7900`, for buttons, heading
  accents, chart strokes, active indicators and upload icons. Previous dark
  orange and alternate hover shades have been removed. Small supporting copy
  uses shared neutral text colors.
- Secondary and tertiary text, panel backgrounds, borders, focus rings and
  status colors use shared variables across the marketing, workflow, submission
  and admin interfaces. The hero image and 3D material colors are preserved.
- Both backer wordmarks now use white artwork, preserving their original
  lettering without introducing another orange into the hero.

## Button feedback and cleaner submission section

- Hero copy now reads “Reduce robot deployment time by 5×” with “With
  simulations.” beneath it. A wider headline, more line spacing, and fewer
  supporting words give the hero more breathing room. The original hero image
  is preserved.
- Main marketing buttons and file pickers use a single stationary label with
  a slight opacity change while pressed. The previous rolling text, duplicate
  label and arrow movement have been removed. Clicks and submissions are not
  delayed, and reduced-motion preferences suppress transitions.
- The submission intro now reads “Share your site” with one short sentence.
  A compact form contains the four required fields. Optional context and
  supported formats/limits use native expandable details. Privacy appears once
  beneath the send button.
- Upload handling, validation, retry behavior and form field names are
  preserved. The original hero artwork, orange palette and workflow animation
  are unchanged.
- Typecheck, production build and lint passed, with the pre-existing `_userId` lint warning.
  HTTP checks verified the form fields, closed details and accessible label
  markup. The stale local development cache was replaced, and current CSS was
  confirmed over HTTP. Browser visual review remains unavailable due to the browser tool's
  missing authentication token.

## Latest copy and brand revision

- Replaced the separate bottleneck and solution introductions with
  “Accelerate your robot rollouts” and “Site-specific simulations adapted to
  your teleoperation data.”
- Removed Agility Robotics from the affiliation marquee.
- Updated all booking buttons through `SITE.bookingUrl` to
  `https://cal.com/founders-bow3m9/30min`.
- Preserved the existing animation implementation and service descriptions.
- Typecheck and production build passed. Lint has no errors and the existing
  unused `_userId` warning.
- All nine affiliation/backer logos have now been retrieved and added. Sources
  and adaptations are documented in [BRAND_ASSETS.md](BRAND_ASSETS.md).
- The original hero image and warm neutral palette are preserved. Orange
  accents now consistently use `#ff7900`. No blue palette is applied.
- Browser review of these latest changes is unavailable because the browser
  tool reports that its Codex auth token is unavailable. Local HTTP checks and
  direct asset rendering are used for verification.

## Earlier revisions

The subsequent request for less copy and continuous scroll-driven visuals is
implemented in [SCROLL_REVISION.md](SCROLL_REVISION.md). This checklist records
the preceding review.

Requested in the September 24 design review. Implement on the local redesign
branch; keep the existing baseline design and submission/admin workflows.

- [x] Extend the cinematic hero behind the navigation; remove the white homepage header strip.
- [x] Set backers to Entrepreneurs First and Transpose Platform.
- [x] Explain the deployment bottleneck as adapting ready robots/models to each site: manual reconstruction or extensive onsite teleoperation collection, operational risk, time, scale, and insufficient trajectory/failure diversity.
- [x] Add a centered simulation-led statement before the solution.
- [x] Rewrite the service narrative: URDF creation, physics-accurate site reconstruction, site-specific training, evaluation before rollout, regression testing after deployment.
- [x] Replace the former flat diagram with detailed 3D transformations and a consistent workcell.
- [x] Show complete robot → links/joints → assembled simulation robot.
- [x] Show site → reconstruction → simulated site → robot placed in site.
- [x] Animate pick/transfer/place with training variations and failed attempts.
- [x] Present evaluation as explicit task checks with green Pass and red Fail states.
- [x] Show an illustrative one-week success-rate chart: 95, 97, 98, 99, 100 percent. Clearly identify it as an example, not measured results.
- [x] Move Built & trusted by into the bottom of the hero with scrolling, pause and reduced-motion support.
- [x] Browser-check desktop and the mobile hero/robot scene, keyboard stage navigation, motion pause and media loading.

The word “deconstruction” in the review is interpreted as reconstructing the
site into simulation, consistent with the requested visual progression.

Real-world reference imagery, when used, must be attributed and distinguished
from the illustrative simulated workcell. Do not label generated renders or
existing simulated launch footage as real robot/site recordings.

## Implementation notes

The 3D scenes are illustrative procedural geometry rendered with existing
React Three Fiber/three.js dependencies. They are not footage of a real
warehouse or measured physics results. The same robot and site remain across
the narrative. Point-cloud positions are sampled from the actual scene meshes.
The prior flat SVG workflow was removed.

Manual phase selection pauses and shows that exact stage. Replay resets both
the phase sequence and the robot trajectory. Evaluation displays matching
inspection poses and explicit labeled results. The chart is explicitly an
illustrative week, not a performance claim.

Reduced-motion and offscreen behavior were code-reviewed: automatic phase
advancement is disabled for reduced motion, the canvas renders on demand,
and offscreen/hidden tabs stop the active loop. Browser OS preferences were
not changed. Private submissions/admin code was not modified in this revision.

## Verification for this revision

- `npm run lint`: no errors; the existing unused `_userId` warning remains in
  `lib/auth/entitlements.ts`.
- `npm run typecheck`: passed.
- Production build with the isolated local environment: passed, 23 pages.
- Desktop browser review: transparent hero/header, backer text, integrated
  affiliations, assembled/exploded robot, warehouse point cloud, task motion,
  evaluation Pass/Fail states, and completed week chart inspected.
- The paused reconstruction redraw defect found in browser review was fixed;
  manual phase selection now displays the correct point cloud.
- At 390px, hero spacing and robot scene were inspected; keyboard navigation
  reaches and activates the stage controls.
- Evaluation screenshots and the chart are saved as `revision-evaluation.jpg`
  and `revision-improvement.jpg` in the ignored screenshots directory. Mobile
  hero capture: `revision-mobile-hero.jpg`.
- No production service or database was used for validation.

The full mobile evaluation view and 320px capture could not be completed in
this pass because browser automatic approval review repeatedly returned rate
limits and interrupted review responses. The mobile evaluation controls and
results were verified through the accessibility tree; responsive geometry and
text layout were also inspected in code.
