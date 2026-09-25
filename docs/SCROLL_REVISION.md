# Copy and scroll revision

This revision supersedes the timed, multi-phase workflow in the earlier handoff.
It stays on the local `redesign/website-visual-overhaul` branch.

## Direction

Reviewed https://invariant-ai.com/, including its solution and workflow sections.
The useful principles were large visual compositions, a strong heading with
brief supporting copy, restrained framing, and content that changes as the
visitor moves through the page. Dirac keeps its own palette, robot, and site.

## Changes

- Reduced the bottleneck to one statement, one short explanation, and a readiness graphic.
- Each service has one heading and one sentence. Removed repeated outputs,
  transformation paragraphs, technical headers, phase labels, and playback controls.
- Robot and site appear complete. The site includes the robot immediately.
- Native scroll position drives the camera, robot task, evaluation reveal, and chart.
- Scroll backward to retrace a scene; stop scrolling to hold the exact pose.
- The chart and 3D workcell are labeled illustrative.
- Shortened hero, affiliations, asset introduction, submission introduction, and footer.
- Form labels, upload guidance, privacy link, and server behavior are preserved.

## Implementation and verification

`scroll-timeline.ts` maps position to a deterministic visual state. There is no
elapsed-time accumulator, automatic phase timer, or animation replay loop.
The canvas renders on demand; static robot and warehouse components are memoized.
Reduced motion uses a stable view within each chapter. Chapter links support
keyboard access and direct hashes. Without JavaScript, service copy stays visible.

- Six timeline tests passed: site readiness, full task traversal, reversing,
  continuous geometry across chapter boundaries, reduced motion, and overshoot.
- Desktop site and training visuals inspected; native Page Down changes the scene.
- Mobile site/evaluation inspected at 390px. Chart/headline inspected at 320px.
- At 320px, page width equals viewport width; no horizontal overflow.
- Browser reported no console errors in the reviewed preview.
- Type checking and lint passed; lint retains one existing unused-variable warning.
- Final production build passed and generated 23 pages using isolated configuration.

Review captures are in the ignored screenshots directory:
`scroll-mobile-site.jpg` and `scroll-mobile-320.jpg`.
