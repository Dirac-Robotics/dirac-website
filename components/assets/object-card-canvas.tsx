"use client";

/* eslint-disable react-hooks/immutability -- This is an R3F <Canvas>: three.js
   scene objects and interaction refs are mutated imperatively in the useFrame
   render loop by design, which the React Compiler flags. */

import * as React from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { ContactShadows, Preload } from "@react-three/drei";
import { useReducedMotion } from "motion/react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { ColladaLoader } from "three/examples/jsm/loaders/ColladaLoader.js";

import { useCanvasProfile } from "./canvas-profile";

/**
 * A single measured object rendered in the same Ghost-White studio material as
 * the hero carousel, so the gallery reads as the same cohesive set. It auto-
 * rotates slowly when idle and can be grabbed to spin (mouse or touch). Honors
 * prefers-reduced-motion and drops shadows / pixel ratio on low-power devices.
 */

type ObjType = "obj" | "fbx" | "dae";

function loaderFor(type: ObjType) {
  if (type === "dae") return ColladaLoader;
  if (type === "fbx") return FBXLoader;
  return OBJLoader;
}

const STUDIO_COLOR = new THREE.Color("#cdcac2");

type SpinRef = React.RefObject<{ x: number; y: number }>;

function Model({
  url,
  type,
  rotation,
  fit,
  reduce,
  spin,
  active,
}: {
  url: string;
  type: ObjType;
  rotation?: [number, number, number];
  fit?: number;
  reduce: boolean;
  spin: SpinRef;
  active: React.RefObject<boolean>;
}) {
  const loaded = useLoader(loaderFor(type), url);
  const spinner = React.useRef<THREE.Group>(null);

  const material = React.useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: STUDIO_COLOR.clone(),
        roughness: 0.52,
        metalness: 0.16,
      }),
    [],
  );

  // Clone, re-material, center and fit-to-unit. Mirrors the hero showcase.
  const model = React.useMemo(() => {
    const raw = (
      type === "dae" ? (loaded as { scene: THREE.Object3D }).scene : loaded
    ) as THREE.Object3D;
    const obj = raw.clone(true);
    obj.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.material = material;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const inner = new THREE.Group();
    obj.position.set(-center.x, -center.y, -center.z);
    inner.add(obj);
    inner.scale.setScalar(((fit ?? 1) * 2.3) / maxDim);
    if (rotation) inner.rotation.set(...rotation);
    return inner;
  }, [loaded, material, type, rotation, fit]);

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
  type,
  rotation,
  fit,
  shadows,
  onCursor,
}: {
  url: string;
  type: ObjType;
  rotation?: [number, number, number];
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
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[4, 6.5, 5]}
        intensity={2.2}
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0002}
      />
      <directionalLight position={[-5, 2, -3]} intensity={0.45} />
      <React.Suspense fallback={null}>
        <Model
          url={url}
          type={type}
          rotation={rotation}
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
  type,
  rotation,
  fit,
}: {
  url: string;
  type: ObjType;
  rotation?: [number, number, number];
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
      onCreated={({ gl }) => gl.setClearAlpha(0)}
    >
      <Scene
        url={url}
        type={type}
        rotation={rotation}
        fit={fit}
        shadows={shadows}
        onCursor={setCursor}
      />
    </Canvas>
  );
}
