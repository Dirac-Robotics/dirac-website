"use client";

/* eslint-disable react-hooks/immutability -- This is an R3F <Canvas>: three.js
   scene objects and interaction refs are mutated imperatively in the useFrame
   render loop by design, which the React Compiler flags. */

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

/**
 * A single asset-pack object, rendered from the same preview GLB the asset pack
 * serves so the gallery card matches the asset page. It auto-rotates slowly
 * when idle and can be grabbed to spin (mouse or touch). Honors
 * prefers-reduced-motion and drops shadows / pixel ratio on low-power devices.
 */

type SpinRef = React.RefObject<{ x: number; y: number }>;

function Model({
  url,
  fit,
  reduce,
  spin,
  active,
}: {
  url: string;
  fit?: number;
  reduce: boolean;
  spin: SpinRef;
  active: React.RefObject<boolean>;
}) {
  const scene = useAssetGlb(url);
  const spinner = React.useRef<THREE.Group>(null);

  const { model, materials } = React.useMemo(
    () => cloneForDisplay(scene, { fit }),
    [scene, fit],
  );
  useDisposeMaterials(materials);

  useFrame((_, dt) => {
    const g = spinner.current;
    if (!g) return;
    // Idle auto-rotate; the user's drag takes over while hovering/dragging.
    if (!active.current && !reduce) spin.current.y += Math.min(dt, 0.05) * 0.5;
    g.rotation.y = spin.current.y;
    g.rotation.x = THREE.MathUtils.clamp(spin.current.x, -0.6, 0.6);
  });

  return (
    <group ref={spinner}>
      <primitive object={model} />
    </group>
  );
}

function Scene({
  url,
  fit,
  shadows,
  onCursor,
}: {
  url: string;
  fit?: number;
  shadows: boolean;
  onCursor: (cursor: string) => void;
}) {
  const reduce = !!useReducedMotion();
  const spin = React.useRef({ x: 0, y: 0 });
  const active = React.useRef(false); // hovered or dragging: pauses auto-rotate
  const hovered = React.useRef(false);
  const dragging = React.useRef(false);
  const last = React.useRef({ x: 0, y: 0 });

  const sync = React.useCallback(() => {
    active.current = hovered.current || dragging.current;
    onCursor(dragging.current ? "grabbing" : hovered.current ? "grab" : "");
  }, [onCursor]);

  // Window-level drag so a fast pointer that leaves the card still tracks.
  React.useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!dragging.current) return;
      spin.current.y += (e.clientX - last.current.x) * 0.01;
      spin.current.x += (e.clientY - last.current.y) * 0.01;
      last.current = { x: e.clientX, y: e.clientY };
    };
    const up = () => {
      if (!dragging.current) return;
      dragging.current = false;
      sync();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [sync]);

  return (
    <>
      <StudioRig shadows={shadows} />
      <React.Suspense fallback={null}>
        <Model
          url={url}
          fit={fit}
          reduce={reduce}
          spin={spin}
          active={active}
        />
        <Preload all />
      </React.Suspense>
      <ContactShadows
        position={[0, -1.4, 0]}
        opacity={0.4}
        scale={9}
        blur={2.6}
        far={4}
        color="#000000"
        visible={shadows}
      />

      {/* Invisible hit area: hover pauses the spin, press-drag rotates. */}
      <mesh
        position={[0, 0, 1.5]}
        onPointerOver={(e) => {
          e.stopPropagation();
          hovered.current = true;
          sync();
        }}
        onPointerOut={() => {
          hovered.current = false;
          sync();
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          dragging.current = true;
          last.current = { x: e.clientX, y: e.clientY };
          sync();
        }}
      >
        <planeGeometry args={[6, 5]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </>
  );
}

export default function ObjectCardCanvas({
  url,
  fit,
}: {
  url: string;
  fit?: number;
}) {
  const { dpr, shadows } = useCanvasProfile();
  const [cursor, setCursor] = React.useState("");
  return (
    <Canvas
      className="absolute! inset-0"
      style={{ cursor, touchAction: "pan-y" }}
      dpr={dpr}
      shadows={shadows}
      gl={{ alpha: true, antialias: true }}
      camera={{ position: [0, 0.4, 6], fov: 30 }}
      onCreated={({ gl }) => {
        gl.setClearAlpha(0);
        // Matches the asset-pack viewer, so the same GLB reads the same here.
        gl.toneMappingExposure = 1.25;
      }}
    >
      <Scene url={url} fit={fit} shadows={shadows} onCursor={setCursor} />
    </Canvas>
  );
}
