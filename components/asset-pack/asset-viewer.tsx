"use client";

import {
  Bounds,
  Environment,
  Grid,
  Lightformer,
  OrbitControls,
} from "@react-three/drei";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { Expand, Grid3X3, RotateCcw, SunMedium } from "lucide-react";
import * as React from "react";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";

import { recordAssetPackEvent } from "@/lib/asset-pack/analytics";
import type {
  AssetRecord,
  ViewerMarker,
  ViewerPose,
} from "@/lib/asset-pack/types";

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

function Marker({ marker }: { marker: ViewerMarker }) {
  return (
    <group position={marker.position}>
      <mesh>
        <sphereGeometry args={[marker.kind === "com" ? 0.014 : 0.01, 20, 20]} />
        <meshStandardMaterial
          color={marker.color}
          emissive={marker.color}
          emissiveIntensity={0.8}
        />
      </mesh>
      {marker.kind === "pivot" ? (
        <mesh>
          <torusGeometry args={[0.027, 0.003, 10, 32]} />
          <meshBasicMaterial color={marker.color} />
        </mesh>
      ) : null}
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
  markers,
  target,
}: {
  asset: AssetRecord;
  pose?: ViewerPose;
  lightMode: "dark" | "light";
  grid: boolean;
  resetToken: number;
  visibleParts?: Record<string, boolean>;
  markers?: ViewerMarker[];
  target?: [number, number, number];
}) {
  const controls = React.useRef<{ reset: () => void } | null>(null);
  React.useEffect(() => controls.current?.reset(), [resetToken]);

  return (
    <>
      <color
        attach="background"
        args={[lightMode === "dark" ? "#080a0f" : "#e5e2da"]}
      />
      <ambientLight intensity={lightMode === "dark" ? 1.1 : 1.65} />
      <hemisphereLight
        args={["#fffdf7", "#454854", lightMode === "dark" ? 2.8 : 3.4]}
      />
      <directionalLight position={[4, 7, 5]} intensity={5} castShadow />
      <directionalLight
        position={[-4, 2, -3]}
        intensity={2.2}
        color="#c4d5ed"
      />
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
      <React.Suspense fallback={null}>
        <Bounds fit clip observe margin={markers?.length ? 1.65 : 1.35}>
          <Model
            url={asset.previewGlbUrl}
            pose={pose}
            visibleParts={visibleParts}
          />
          {markers?.map((marker) => (
            <Marker marker={marker} key={marker.label} />
          ))}
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
        target={target ?? asset.preview.target}
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
  markers,
  target,
}: {
  asset: AssetRecord;
  pose?: ViewerPose;
  visibleParts?: Record<string, boolean>;
  markers?: ViewerMarker[];
  target?: [number, number, number];
}) {
  const shell = React.useRef<HTMLDivElement>(null);
  const [grid, setGrid] = React.useState(true);
  const [lightMode, setLightMode] = React.useState<"dark" | "light">("light");
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
            onCreated={({ gl }) => {
              gl.toneMappingExposure = 1.25;
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
              markers={markers}
              target={target}
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

        {markers?.length ? (
          <div className="data absolute top-3 left-3 z-10 grid gap-1.5 bg-black/75 p-3 text-[0.58rem] uppercase text-white/80">
            {markers.map((marker) => (
              <div className="flex items-center gap-2" key={marker.label}>
                <span
                  className="size-2"
                  style={{ backgroundColor: marker.color }}
                />
                {marker.label}
              </div>
            ))}
          </div>
        ) : null}

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
