"use client";

/* eslint-disable react-hooks/immutability -- This is an R3F <Canvas>: three.js
   scene objects (transforms, materials, visibility) are mutated imperatively in
   the useFrame render loop by design, which the React Compiler flags. */

import * as React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Preload } from "@react-three/drei";
import { useReducedMotion } from "motion/react";
import * as THREE from "three";

import { useCanvasProfile } from "./canvas-profile";
import {
  cloneForDisplay,
  StudioRig,
  useAssetGlb,
  useDisposeMaterials,
} from "./glb-display";
import { SHOWCASE_ASSETS, type ShowcaseAsset } from "./asset-showcase-data";

export type ShowcaseControls = { next: () => void; prev: () => void };

/**
 * Interactive 3D showcase for the hero.
 *
 * A cover-flow of the three shipped asset-pack objects (chair, table, hammer),
 * rendered from the same preview GLBs the asset pack uses so the hero shows the
 * real assets rather than stand-ins. The center model auto-advances every few
 * seconds; hovering it pauses the rotation and lets you drag to spin it. Honors
 * prefers-reduced-motion (no auto-advance, no idle float).
 */

const OBJECTS = SHOWCASE_ASSETS;
const INTERVAL_S = 3;
const N = OBJECTS.length;

/** Flanks are tinted toward the page background so the center reads as subject. */
const FLANK_COLOR = new THREE.Color("#5c5e68");
const FLANK_TINT = 0.6;

/** Shortest signed distance from `active` on the ring (…-1, 0, 1…). */
function relativeIndex(i: number, active: number) {
  let d = i - active;
  if (d > N / 2) d -= N;
  if (d < -N / 2) d += N;
  return d;
}

/** Cover-flow target transform for a given signed distance from center. */
function targetFor(rel: number) {
  const s = Math.sign(rel);
  const a = Math.min(Math.abs(rel), 1);
  return {
    x: rel * 2.7,
    z: -a * 1.6,
    scale: 1 - a * 0.4,
    rotY: -s * 0.55,
    dim: a, // 0 at center, 1 on the flanks
  };
}

type SpinRef = React.RefObject<{ x: number; y: number }>;

function ShowcaseItem({
  def,
  index,
  active,
  spin,
  paused,
  reduce,
}: {
  def: ShowcaseAsset;
  index: number;
  active: number;
  spin: SpinRef;
  paused: React.RefObject<boolean>;
  reduce: boolean;
}) {
  const scene = useAssetGlb(def.url);
  const outer = React.useRef<THREE.Group>(null);
  const spinG = React.useRef<THREE.Group>(null);

  // Cloned per item, so tinting and fading one flank leaves the others alone.
  const { model, materials } = React.useMemo(
    () => cloneForDisplay(scene, { fit: def.fit }),
    [scene, def.fit],
  );
  useDisposeMaterials(materials);

  useFrame((_, dt) => {
    const g = outer.current;
    const sg = spinG.current;
    if (!g || !sg) return;
    const rel = relativeIndex(index, active);
    const t = targetFor(rel);
    const isCenter = rel === 0;
    const k = Math.min(dt, 0.05);

    g.position.x = THREE.MathUtils.damp(g.position.x, t.x, 6, k);
    g.position.z = THREE.MathUtils.damp(g.position.z, t.z, 6, k);
    const floatY =
      isCenter && !reduce && !paused.current
        ? Math.sin(performance.now() / 1400) * 0.06
        : 0;
    g.position.y = THREE.MathUtils.damp(g.position.y, floatY, 5, k);
    const sc = THREE.MathUtils.damp(g.scale.x, t.scale, 6, k);
    g.scale.setScalar(sc);
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, t.rotY, 6, k);

    // Fade anything past the two flanks fully out, so on a multi-object ring the
    // hidden items never streak across the view when they wrap around.
    const opacityTarget = Math.abs(rel) <= 1 ? (isCenter ? 1 : 0.94) : 0;
    let opacity = 1;
    for (const { material, baseColor } of materials) {
      material.opacity = THREE.MathUtils.damp(
        material.opacity,
        opacityTarget,
        6,
        k,
      );
      opacity = material.opacity;
      // Dim flanks toward the background so the center reads as the subject.
      // Tinting the base color keeps the real texture maps intact.
      if (baseColor) {
        (material as THREE.Material & { color: THREE.Color }).color
          .copy(baseColor)
          .lerp(FLANK_COLOR, t.dim * FLANK_TINT);
      }
    }
    g.visible = opacity > 0.02;

    // Drag-spin only the centered model; ease the others back to rest.
    if (isCenter) {
      sg.rotation.y = spin.current.y;
      sg.rotation.x = THREE.MathUtils.clamp(spin.current.x, -0.65, 0.65);
    } else {
      sg.rotation.y = THREE.MathUtils.damp(sg.rotation.y, 0, 6, k);
      sg.rotation.x = THREE.MathUtils.damp(sg.rotation.x, 0, 6, k);
    }
  });

  return (
    <group ref={outer}>
      <group ref={spinG}>
        <primitive object={model} />
      </group>
    </group>
  );
}

function Scene({
  onActiveChange,
  onCursor,
  shadows,
  controlsRef,
}: {
  onActiveChange: (i: number) => void;
  onCursor: (cursor: string) => void;
  shadows: boolean;
  controlsRef?: React.RefObject<ShowcaseControls | null>;
}) {
  const reduce = !!useReducedMotion();
  const [active, setActive] = React.useState(0);

  const acc = React.useRef(0);
  const paused = React.useRef(false);
  const hovered = React.useRef(false);
  const dragging = React.useRef(false);
  const spin = React.useRef({ x: 0, y: 0 });
  const drag = React.useRef({ x: 0, y: 0 });

  const syncPaused = React.useCallback(() => {
    paused.current = hovered.current || dragging.current;
    onCursor(dragging.current ? "grabbing" : hovered.current ? "grab" : "");
  }, [onCursor]);

  const onHoverChange = React.useCallback(
    (h: boolean) => {
      hovered.current = h;
      syncPaused();
    },
    [syncPaused],
  );

  const onDragStart = React.useCallback(
    (e: { clientX: number; clientY: number }) => {
      dragging.current = true;
      drag.current = { x: e.clientX, y: e.clientY };
      syncPaused();
    },
    [syncPaused],
  );

  // Window-level drag so a fast pointer that leaves the model still tracks.
  React.useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!dragging.current) return;
      spin.current.y += (e.clientX - drag.current.x) * 0.01;
      spin.current.x += (e.clientY - drag.current.y) * 0.01;
      drag.current = { x: e.clientX, y: e.clientY };
    };
    const up = () => {
      if (!dragging.current) return;
      dragging.current = false;
      syncPaused();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [syncPaused]);

  // Reset spin whenever a new model reaches center.
  React.useEffect(() => {
    spin.current = { x: 0, y: 0 };
    onActiveChange(active);
  }, [active, onActiveChange]);

  // Manual navigation (prev/next arrows). Resets the auto-advance accumulator
  // so a click does not immediately advance again.
  const step = React.useCallback((dir: number) => {
    acc.current = 0;
    setActive((a) => (a + dir + N) % N);
  }, []);
  React.useEffect(() => {
    if (!controlsRef) return;
    controlsRef.current = { next: () => step(1), prev: () => step(-1) };
    return () => {
      controlsRef.current = null;
    };
  }, [controlsRef, step]);

  // Auto-advance via a frame accumulator so hover/drag can pause it cleanly.
  useFrame((_, dt) => {
    if (reduce || paused.current) {
      acc.current = 0;
      return;
    }
    acc.current += dt;
    if (acc.current >= INTERVAL_S) {
      acc.current = 0;
      setActive((a) => (a + 1) % N);
    }
  });

  return (
    <>
      <StudioRig shadows={shadows} />
      <React.Suspense fallback={null}>
        {OBJECTS.map((def, i) => (
          <ShowcaseItem
            key={def.url}
            def={def}
            index={i}
            active={active}
            spin={spin}
            paused={paused}
            reduce={reduce}
          />
        ))}
        <Preload all />
      </React.Suspense>

      {/* Invisible hit area over the center slot: hovering pauses the carousel
          and press-drag spins the centered model. Larger than any single object
          so the interaction target stays forgiving. */}
      <mesh
        position={[0, 0, 1.4]}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHoverChange(true);
        }}
        onPointerOut={() => onHoverChange(false)}
        onPointerDown={(e) => {
          e.stopPropagation();
          onDragStart({ clientX: e.clientX, clientY: e.clientY });
        }}
      >
        <planeGeometry args={[3, 3.6]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <ContactShadows
        position={[0, -1.5, 0]}
        opacity={0.4}
        scale={12}
        blur={2.6}
        far={4.5}
        color="#000000"
        visible={shadows}
      />
    </>
  );
}

export default function ShowcaseCanvas({
  onActiveChange,
  onCursor,
  controlsRef,
}: {
  onActiveChange: (i: number) => void;
  onCursor: (cursor: string) => void;
  controlsRef?: React.RefObject<ShowcaseControls | null>;
}) {
  const { dpr, shadows } = useCanvasProfile();
  return (
    <Canvas
      className="absolute! inset-0"
      style={{ touchAction: "pan-y" }}
      dpr={dpr}
      shadows={shadows}
      gl={{ alpha: true, antialias: true }}
      camera={{ position: [0, 0.35, 6.4], fov: 32 }}
      onCreated={({ gl }) => {
        gl.setClearAlpha(0);
        // Matches the asset-pack viewer, so the same GLB reads the same here.
        gl.toneMappingExposure = 1.25;
      }}
    >
      <Scene
        onActiveChange={onActiveChange}
        onCursor={onCursor}
        shadows={shadows}
        controlsRef={controlsRef}
      />
    </Canvas>
  );
}

export { OBJECTS };
