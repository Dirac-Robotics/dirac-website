"use client";

/* eslint-disable react-hooks/immutability -- This is an R3F <Canvas>: three.js
   scene objects (transforms, materials, visibility) are mutated imperatively in
   the useFrame render loop by design, which the React Compiler flags. */

import * as React from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { ContactShadows, Preload } from "@react-three/drei";
import { useReducedMotion } from "motion/react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { ColladaLoader } from "three/examples/jsm/loaders/ColladaLoader.js";

import { useCanvasProfile } from "./canvas-profile";

export type ShowcaseControls = { next: () => void; prev: () => void };

/**
 * Interactive 3D showcase for the hero.
 *
 * A cover-flow of measured-object models (glasses, chair, kettle) rendered in a
 * uniform Ghost-White studio material so they read as one cohesive set on the
 * near-black page. The center model auto-advances every few seconds; hovering
 * it pauses the rotation and lets you drag to spin it. Honors
 * prefers-reduced-motion (no auto-advance, no idle float).
 */

type ObjType = "obj" | "fbx" | "dae";

type ObjDef = {
  name: string;
  url: string;
  type: ObjType;
  /** Base orientation so the model sits upright and faces the camera. */
  rotation?: [number, number, number];
  /** Fine size nudge after fit-to-unit normalization. */
  fit?: number;
};

// Order chosen so the cleanest silhouette opens centered.
const OBJECTS: ObjDef[] = [
  { name: "Eyewear", url: "/models/objects/glasses.dae", type: "dae" },
  { name: "Lounge chair", url: "/models/objects/chair.fbx", type: "fbx" },
  {
    name: "Kettle",
    url: "/models/objects/teapot.obj",
    type: "obj",
    // Source model sits top-down; stand it upright and face the camera.
    rotation: [-Math.PI / 2, 0, 0],
  },
  { name: "Rubber duck", url: "/models/objects/duck.dae", type: "dae" },
];

const INTERVAL_S = 3;
const N = OBJECTS.length;

const CENTER_COLOR = new THREE.Color("#cdcac2");
const FLANK_COLOR = new THREE.Color("#5c5e68");

function loaderFor(type: ObjType) {
  if (type === "dae") return ColladaLoader;
  if (type === "fbx") return FBXLoader;
  return OBJLoader;
}

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
  def: ObjDef;
  index: number;
  active: number;
  spin: SpinRef;
  paused: React.RefObject<boolean>;
  reduce: boolean;
}) {
  const loaded = useLoader(loaderFor(def.type), def.url);
  const outer = React.useRef<THREE.Group>(null);
  const spinG = React.useRef<THREE.Group>(null);

  // One material per item so flanks can dim independently of the center.
  const material = React.useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: CENTER_COLOR.clone(),
        roughness: 0.52,
        metalness: 0.16,
        transparent: true,
      }),
    [],
  );

  // Clone, re-material, center and fit-to-unit. Memoized on the loaded asset.
  const model = React.useMemo(() => {
    const raw = (
      def.type === "dae" ? (loaded as { scene: THREE.Object3D }).scene : loaded
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
    inner.scale.setScalar(((def.fit ?? 1) * 2.3) / maxDim);
    if (def.rotation) inner.rotation.set(...def.rotation);
    return inner;
  }, [loaded, def, material]);

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

    // Dim flanks toward the background so the center reads as the subject.
    material.color.copy(CENTER_COLOR).lerp(FLANK_COLOR, t.dim);

    // Fade anything past the two flanks fully out, so on a multi-object ring the
    // hidden items never streak across the view when they wrap around.
    const opacityTarget = Math.abs(rel) <= 1 ? (isCenter ? 1 : 0.94) : 0;
    material.opacity = THREE.MathUtils.damp(
      material.opacity,
      opacityTarget,
      6,
      k,
    );
    g.visible = material.opacity > 0.02;

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
      onCreated={({ gl }) => gl.setClearAlpha(0)}
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
