"use client";

import * as React from "react";
import { useLoader, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";

/**
 * Shared plumbing for showing asset-pack preview GLBs on the home page, so the
 * hero carousel and the gallery cards render the same objects the same way the
 * asset-pack viewer does.
 */

/**
 * Loads an asset-pack preview GLB.
 *
 * These are meshopt-compressed with KTX2 textures, so the loader needs both
 * decoders wired up exactly as the asset-pack viewer does it. Must be called
 * inside a <Canvas>: KTX2 transcoder support is probed off the live renderer.
 */
export function useAssetGlb(url: string): THREE.Object3D {
  const renderer = useThree((state) => state.gl);
  const { scene } = useLoader(GLTFLoader, url, (loader) => {
    const ktx2 = new KTX2Loader()
      .setTranscoderPath("/asset-pack/basis/")
      .detectSupport(renderer);
    loader.setKTX2Loader(ktx2);
    loader.setMeshoptDecoder(MeshoptDecoder);
  });
  return scene;
}

/** A cloned material plus the base color it started with, for tinting. */
export type TintableMaterial = {
  material: THREE.Material;
  baseColor: THREE.Color | null;
};

export type PreparedModel = {
  /** Centered, unit-fitted group, ready to drop into the scene. */
  model: THREE.Group;
  /** Every cloned material, so callers can fade or tint this instance alone. */
  materials: TintableMaterial[];
};

function hasColor(
  material: THREE.Material,
): material is THREE.Material & { color: THREE.Color } {
  return "color" in material && (material as { color?: unknown }).color
    ? (material as { color: unknown }).color instanceof THREE.Color
    : false;
}

/**
 * Clones a loaded GLB scene for display: per-instance materials (so one card
 * fading out cannot dim its neighbours or the shared cached scene), shadows on,
 * then centered at the origin and scaled to a common size.
 *
 * `useLoader` caches by URL, so the same GLB shown in the hero and in a gallery
 * card is downloaded once and cloned twice.
 */
export function cloneForDisplay(
  scene: THREE.Object3D,
  { fit = 1, size = 2.3 }: { fit?: number; size?: number } = {},
): PreparedModel {
  const object = scene.clone(true);
  const materials: TintableMaterial[] = [];

  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    const sources = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    const cloned = sources.map((source) => {
      const copy = source.clone();
      // Needed so the hero can fade flank items out without popping.
      copy.transparent = true;
      materials.push({
        material: copy,
        baseColor: hasColor(copy) ? copy.color.clone() : null,
      });
      return copy;
    });
    mesh.material = cloned.length === 1 ? cloned[0] : cloned;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  });

  const box = new THREE.Box3().setFromObject(object);
  const extent = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(extent.x, extent.y, extent.z) || 1;

  const inner = new THREE.Group();
  object.position.set(-center.x, -center.y, -center.z);
  inner.add(object);
  inner.scale.setScalar((fit * size) / maxDim);
  return { model: inner, materials };
}

/** Disposes cloned materials when the instance unmounts. */
export function useDisposeMaterials(materials: TintableMaterial[]) {
  React.useEffect(() => {
    return () => {
      for (const { material } of materials) material.dispose();
    };
  }, [materials]);
}

/**
 * Studio rig matching the asset-pack viewer. The real GLB materials are PBR
 * (velvet, glass, brushed steel) and need an environment to read at all, which
 * the old flat Ghost-White override did not.
 */
export function StudioRig({ shadows }: { shadows: boolean }) {
  return (
    <>
      <ambientLight intensity={1.1} />
      <hemisphereLight args={["#fffdf7", "#454854", 2.8]} />
      <directionalLight
        position={[4, 7, 5]}
        intensity={4}
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0002}
      />
      <directionalLight position={[-4, 2, -3]} intensity={1.8} color="#c4d5ed" />
      <Environment resolution={128}>
        <Lightformer
          form="rect"
          intensity={5}
          color="#fff8e8"
          position={[0, 3, 4]}
          scale={[5, 5, 1]}
        />
        <Lightformer
          form="rect"
          intensity={3}
          color="#b8d8ff"
          position={[-4, 1, 0]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[4, 4, 1]}
        />
        <Lightformer
          form="rect"
          intensity={4}
          color="#ffffff"
          position={[0, 5, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[4, 4, 1]}
        />
      </Environment>
    </>
  );
}
