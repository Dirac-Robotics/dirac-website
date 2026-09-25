# Workflow imagery audit and provenance

Inspected September 24, 2026. No fabricated real photographs were generated.
Only the image and attribution files in `public/media/workflow/` were added;
no existing source media, frontend components, or backend files were changed.

## Usable physical robot reference

`public/media/workflow/ur5-reference.webp` is a real photograph of a Universal
Robots UR5 by **GrowSkills Robotics**. Wikimedia Commons describes it as
"Cobot UR5" and identifies the contributor's own work under **CC BY-SA 4.0**.

- Source: https://commons.wikimedia.org/wiki/File:Cobot.jpg
- License: https://creativecommons.org/licenses/by-sa/4.0/
- Optimized image: 520 × 608 pixels, 24,262 bytes (WebP)
- Machine-readable provenance: `public/media/workflow/ur5-reference.source.json`
- Attribution requirements: `public/media/workflow/ATTRIBUTION.md`
- Derivation: crop away empty headroom and the cart/controller, resize, encode
  as WebP. Robot color and geometry remain unchanged.

Use a modest reference inset in the first robot-model phase, with visible label
**Physical robot reference · UR5** and linked credit:
**UR5 photo: GrowSkills Robotics / Wikimedia Commons · CC BY-SA 4.0 · cropped**.
Link the photographer/source text to the source page and the license text to
the license URL. The derivative image retains the same license.

The photo depicts a silver/blue UR5 on a demonstration cart. It does **not**
depict a Dirac deployment, the generic orange procedural robot, or a warehouse
pick-and-place cell. Keep the inset visibly distinct from the main scene and
do not animate it as an exact reconstruction of the procedural robot. The
same procedural robot/workstation should carry all five story stages.

## Existing repository media

| Existing file | Inspected content | Suitability |
|---|---|---|
| `public/media/dirac-launch-poster.webp` | Real lounge view with purple chair, glass table, EF sign; baked-in "original video / shot on an iPhone" text | Existing real-room reference, not warehouse footage |
| `public/media/real2sim-comparison.webp` | Two source/render comparisons of the same chair/table/sign room | Honest existing real-to-sim room comparison; unrelated to warehouse task |
| `public/media/real2sim-scene-poster.webp` | Rendered room with chair, table and sign | Simulation example only |
| `public/media/real2sim-scene.glb` | 21,531,256-byte GLB, 28 named nodes: room surfaces, sign parts, chair and table; no robot/warehouse nodes | Existing lounge scene, too large and unrelated for the workflow opener |
| `public/media/dirac-launch.mp4` | 50.684-second clip; sampled frames show a white rendered manipulator moving around the same lounge | Simulated robot motion, not physical robot/warehouse footage |
| `public/media/robot-horizon.webp` | Existing cinematic robot/arc hero | Existing hero composition; no independent robot layer |

Eight video frames were extracted and visually inspected at approximately
0.0, 6.34, 12.67, 19.01, 25.34, 31.68, 38.01 and 44.35 seconds. Inspection used
macOS AVFoundation for local decoding because ffmpeg was not installed; frame
contact-sheet generation used Pillow. The sampled robot frames look rendered,
consistent with the existing reconstructed lounge. They must not be presented
as physical footage. The repository media retains its existing project rights;
no separate new external license was asserted for these files.

No usable real warehouse/pick-and-place footage was found in these assets.
The lounge media was not imported into the new warehouse story because doing
so would imply continuity between unrelated environments.

## Optional model source, inspected but not imported

ROS Industrial's `universal_robot` repository provides UR5 meshes and robot
description source. The `ur_description/LICENSE` file contains a three-clause
BSD-style redistribution license. The inspected tree was pinned to commit
`39ad110d8f2e8f66856a201cca88aa7a7025e3eb`.

- Package license: https://github.com/ros-industrial/universal_robot/blob/39ad110d8f2e8f66856a201cca88aa7a7025e3eb/ur_description/LICENSE
- UR5 meshes: https://github.com/ros-industrial/universal_robot/tree/39ad110d8f2e8f66856a201cca88aa7a7025e3eb/ur_description/meshes/ur5

No ROS meshes or model code were downloaded into the website. The workflow
agent's deliberately generic procedural robot avoids loading large mesh
dependencies and can preserve its exact geometry across all five stages.
