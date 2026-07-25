"use client";

import * as React from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { ContactShadows, Preload } from "@react-three/drei";
import { useReducedMotion } from "motion/react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { ColladaLoader } from "three/examples/jsm/loaders/ColladaLoader.js";

/**
 * A single measured object rendered in the same Ghost-White studio material as
 * the hero carousel, so the gallery reads as the same cohesive set. The model
 * auto-rotates slowly (paused under prefers-reduced-motion).
 */

type ObjType = "obj" | "fbx" | "dae";

function loaderFor(type: ObjType) {
  if (type === "dae") return ColladaLoader;
  if (type === "fbx") return FBXLoader;
  return OBJLoader;
}

const STUDIO_COLOR = new THREE.Color("#cdcac2");

function Model({
  url,
  type,
  rotation,
  fit,
  reduce,
}: {
  url: string;
  type: ObjType;
  rotation?: [number, number, number];
  fit?: number;
  reduce: boolean;
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
    if (!g || reduce) return;
    g.rotation.y += Math.min(dt, 0.05) * 0.5;
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
}: {
  url: string;
  type: ObjType;
  rotation?: [number, number, number];
  fit?: number;
}) {
  const reduce = !!useReducedMotion();
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[4, 6.5, 5]}
        intensity={2.2}
        castShadow
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
      />
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
  return (
    <Canvas
      className="absolute! inset-0"
      dpr={[1, 2]}
      shadows
      gl={{ alpha: true, antialias: true }}
      camera={{ position: [0, 0.4, 6], fov: 30 }}
      onCreated={({ gl }) => gl.setClearAlpha(0)}
    >
      <Scene url={url} type={type} rotation={rotation} fit={fit} />
    </Canvas>
  );
}
