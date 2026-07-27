"use client";

import { Bounds, Grid, OrbitControls } from "@react-three/drei";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { Expand, Grid3X3, RotateCcw, SunMedium } from "lucide-react";
import * as React from "react";
import { BufferAttribute, BufferGeometry } from "three";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";

import { recordAssetPackEvent } from "@/lib/asset-pack/analytics";
import type {
  AssetRecord,
  TransformTrack,
  ViewerPose,
} from "@/lib/asset-pack/types";

function PcaDeformation({
  track,
  frame,
}: {
  track: TransformTrack;
  frame: number;
}) {
  const geometry = React.useMemo(() => {
    const next = new BufferGeometry();
    if (!track.pca) return next;
    next.setAttribute(
      "position",
      new BufferAttribute(new Float32Array(track.pca.rest), 3),
    );
    next.setIndex(track.pca.faces);
    next.computeVertexNormals();
    return next;
  }, [track]);

  React.useEffect(() => () => geometry.dispose(), [geometry]);

  React.useEffect(() => {
    if (!track.pca) return;
    const position = geometry.getAttribute("position") as BufferAttribute;
    const weights =
      track.pca.weights[Math.min(frame, track.pca.weights.length - 1)] ?? [];
    const values = position.array as Float32Array;
    for (let index = 0; index < track.pca.rest.length; index += 1) {
      let value = track.pca.rest[index];
      for (let mode = 0; mode < track.pca.modeCount; mode += 1) {
        value += (weights[mode] ?? 0) * track.pca.modes[mode][index];
      }
      values[index] = value;
    }
    position.needsUpdate = true;
    geometry.computeVertexNormals();
  }, [frame, geometry, track]);

  if (!track.pca) return null;
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color="#e8e6e0"
        emissive="#8a8a8a"
        emissiveIntensity={0.2}
        transparent
        opacity={0.38}
        wireframe
        depthWrite={false}
      />
    </mesh>
  );
}

function Model({
  url,
  pose,
  visibleParts,
}: {
  url: string;
  pose?: ViewerPose;
  visibleParts?: Record<string, boolean>;
}) {
  const renderer = useThree((state) => state.gl);
  const { scene } = useLoader(GLTFLoader, url, (loader) => {
    const ktx2 = new KTX2Loader()
      .setTranscoderPath("/asset-pack/basis/")
      .detectSupport(renderer);
    loader.setKTX2Loader(ktx2);
    loader.setMeshoptDecoder(MeshoptDecoder);
  });
  const copy = React.useMemo(() => scene.clone(true), [scene]);

  React.useEffect(() => {
    copy.traverse((object) => {
      const sourceVisible =
        typeof object.userData.assetPackSourceVisible === "boolean"
          ? object.userData.assetPackSourceVisible
          : object.visible;
      object.userData.assetPackSourceVisible = sourceVisible;
      object.visible = sourceVisible;

      if (!visibleParts) return;
      const material = (
        object as {
          material?: { name?: string } | { name?: string }[];
        }
      ).material;
      const materialName =
        material && !Array.isArray(material) ? material.name ?? "" : "";
      const key = `${object.name} ${materialName}`.toLowerCase();
      if (visibleParts.steel === false && key.includes("steel")) {
        object.visible = false;
      }
      if (visibleParts.wood === false && key.includes("wood")) {
        object.visible = false;
      }
      if (visibleParts.glass === false && key.includes("glass")) {
        object.visible = false;
      }
      if (
        visibleParts.metal === false &&
        /(metal|ring|rod|tray)/.test(key)
      ) {
        object.visible = false;
      }
    });
  }, [copy, visibleParts]);

  return (
    <group
      position={pose?.position ?? [0, 0, 0]}
      quaternion={pose?.quaternion ?? [0, 0, 0, 1]}
    >
      <primitive object={copy} />
    </group>
  );
}

function Scene({
  asset,
  pose,
  lightMode,
  grid,
  resetToken,
  visibleParts,
  deformation,
}: {
  asset: AssetRecord;
  pose?: ViewerPose;
  lightMode: "dark" | "light";
  grid: boolean;
  resetToken: number;
  visibleParts?: Record<string, boolean>;
  deformation?: { track: TransformTrack; frame: number };
}) {
  const controls = React.useRef<{ reset: () => void } | null>(null);
  React.useEffect(() => controls.current?.reset(), [resetToken]);

  return (
    <>
      <color
        attach="background"
        args={[lightMode === "dark" ? "#050508" : "#d9d7d1"]}
      />
      <hemisphereLight
        args={["#f1f0ec", "#20212a", lightMode === "dark" ? 2 : 2.5]}
      />
      <directionalLight position={[4, 7, 5]} intensity={3.5} castShadow />
      <directionalLight
        position={[-4, 2, -3]}
        intensity={1.2}
        color="#a8a9b2"
      />
      <React.Suspense fallback={null}>
        <Bounds fit clip observe margin={1.35}>
          <Model
            url={asset.previewGlbUrl}
            pose={pose}
            visibleParts={visibleParts}
          />
          {deformation ? (
            <PcaDeformation
              track={deformation.track}
              frame={deformation.frame}
            />
          ) : null}
        </Bounds>
      </React.Suspense>
      {grid ? (
        <Grid
          position={[0, -0.001, 0]}
          args={[asset.preview.gridSize, asset.preview.gridSize]}
          cellSize={0.1}
          cellThickness={0.6}
          cellColor={lightMode === "dark" ? "#3a3c44" : "#8a8a8a"}
          sectionSize={1}
          sectionThickness={1}
          sectionColor={lightMode === "dark" ? "#8a8a8a" : "#3a3c44"}
          fadeDistance={8}
          infiniteGrid
        />
      ) : null}
      <OrbitControls
        ref={controls as React.MutableRefObject<never>}
        makeDefault
        target={asset.preview.target}
        minDistance={0.08}
        maxDistance={12}
        enableDamping
      />
    </>
  );
}

export function AssetViewer({
  asset,
  pose,
  visibleParts,
  deformation,
}: {
  asset: AssetRecord;
  pose?: ViewerPose;
  visibleParts?: Record<string, boolean>;
  deformation?: { track: TransformTrack; frame: number };
}) {
  const shell = React.useRef<HTMLDivElement>(null);
  const [grid, setGrid] = React.useState(true);
  const [lightMode, setLightMode] = React.useState<"dark" | "light">("dark");
  const [resetToken, setResetToken] = React.useState(0);
  const [webgl, setWebgl] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    let supported = false;
    try {
      const canvas = document.createElement("canvas");
      supported = Boolean(
        canvas.getContext("webgl2") || canvas.getContext("webgl"),
      );
    } catch {}
    const request = requestAnimationFrame(() => setWebgl(supported));
    recordAssetPackEvent("viewer_open", { assetSlug: asset.slug });
    return () => cancelAnimationFrame(request);
  }, [asset.slug]);

  async function toggleFullscreen() {
    if (!document.fullscreenElement) {
      await shell.current?.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }

  const toolClass =
    "inline-flex h-9 items-center gap-1.5 border border-white/15 bg-black/70 px-2.5 text-xs text-white transition-colors hover:border-white/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50";

  return (
    <div ref={shell} className="w-full bg-(--void)">
      <div className="relative h-[420px] w-full overflow-hidden md:h-[540px]">
        {webgl === true ? (
          <Canvas
            camera={{
              position: asset.preview.cameraPosition,
              fov: 38,
              near: 0.005,
              far: 100,
            }}
            dpr={[1, 1.75]}
            gl={{
              antialias: true,
              alpha: false,
              powerPreference: "high-performance",
            }}
            shadows
          >
            <Scene
              asset={asset}
              pose={pose}
              lightMode={lightMode}
              grid={grid}
              resetToken={resetToken}
              visibleParts={visibleParts}
              deformation={deformation}
            />
          </Canvas>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="h-full w-full object-cover"
            src={asset.posterUrl}
            alt={`${asset.title} preview`}
          />
        )}

        <div
          className="absolute top-3 right-3 z-10 flex gap-1"
          aria-label="3D viewer controls"
        >
          <button
            className={toolClass}
            onClick={() => setResetToken((value) => value + 1)}
            title="Reset camera"
          >
            <RotateCcw className="size-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>
          <button
            className={toolClass}
            onClick={() => setGrid((value) => !value)}
            aria-pressed={grid}
            title="Toggle unit grid"
          >
            <Grid3X3 className="size-4" />
            <span className="hidden sm:inline">Grid</span>
          </button>
          <button
            className={toolClass}
            onClick={() =>
              setLightMode((value) => (value === "dark" ? "light" : "dark"))
            }
            title="Switch lighting"
          >
            <SunMedium className="size-4" />
            <span className="hidden sm:inline">Light</span>
          </button>
          <button
            className={toolClass}
            onClick={toggleFullscreen}
            title="Fullscreen"
          >
            <Expand className="size-4" />
            <span className="hidden sm:inline">Full</span>
          </button>
        </div>
        <span className="data absolute bottom-3 left-3 z-10 bg-black/70 px-2 py-1 text-[0.58rem] uppercase text-white/70">
          Drag to orbit · scroll to zoom · 10 cm grid
        </span>
      </div>
    </div>
  );
}
