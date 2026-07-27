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
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  type Material,
} from "three";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";

import { recordAssetPackEvent } from "@/lib/asset-pack/analytics";
import type {
  AssetRecord,
  TransformTrack,
  ViewerComparison,
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
    const faces = track.pca.displayAlignment
      ? track.pca.faces.flatMap((_, faceOffset, sourceFaces) => {
          if (faceOffset % 3 !== 0) return [];
          const first = sourceFaces[faceOffset] * 3;
          const second = sourceFaces[faceOffset + 1] * 3;
          const third = sourceFaces[faceOffset + 2] * 3;
          const rest = track.pca?.rest ?? [];
          const edgeSquared = (left: number, right: number) => {
            const deltaX = rest[left] - rest[right];
            const deltaY = rest[left + 1] - rest[right + 1];
            const deltaZ = rest[left + 2] - rest[right + 2];
            return deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ;
          };
          const firstX = rest[second] - rest[first];
          const firstY = rest[second + 1] - rest[first + 1];
          const firstZ = rest[second + 2] - rest[first + 2];
          const secondX = rest[third] - rest[first];
          const secondY = rest[third + 1] - rest[first + 1];
          const secondZ = rest[third + 2] - rest[first + 2];
          const crossX = firstY * secondZ - firstZ * secondY;
          const crossY = firstZ * secondX - firstX * secondZ;
          const crossZ = firstX * secondY - firstY * secondX;
          const areaSquared =
            crossX * crossX + crossY * crossY + crossZ * crossZ;
          const maxEdgeSquared = 0.035 ** 2;
          const valid =
            areaSquared > 1e-16 &&
            edgeSquared(first, second) <= maxEdgeSquared &&
            edgeSquared(second, third) <= maxEdgeSquared &&
            edgeSquared(third, first) <= maxEdgeSquared;
          return valid
            ? sourceFaces.slice(faceOffset, faceOffset + 3)
            : [];
        })
      : track.pca.faces;
    next.setIndex(faces);
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
        color="#b794f4"
        emissive="#6b46c1"
        emissiveIntensity={0.35}
        roughness={0.72}
        side={DoubleSide}
        transparent
        opacity={0.3}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-1}
        polygonOffsetUnits={-1}
      />
    </mesh>
  );
}

type ModelTone = "standard" | "comparison";

function styleComparisonMaterial(material: Material): Material {
  const next = material.clone() as Material & {
    color?: Color;
    emissive?: Color;
    emissiveIntensity?: number;
  };
  next.color?.lerp(new Color("#55c7f3"), 0.58);
  next.emissive?.set("#123f56");
  if (typeof next.emissiveIntensity === "number") {
    next.emissiveIntensity = Math.max(next.emissiveIntensity, 0.3);
  }
  next.transparent = true;
  next.opacity = Math.min(next.opacity, 0.78);
  return next;
}
function Model({
  url,
  pose,
  visibleParts,
  tone = "standard",
}: {
  url: string;
  pose?: ViewerPose;
  visibleParts?: Record<string, boolean>;
  tone?: ModelTone;
}) {
  const renderer = useThree((state) => state.gl);
  const { scene } = useLoader(GLTFLoader, url, (loader) => {
    const ktx2 = new KTX2Loader()
      .setTranscoderPath("/asset-pack/basis/")
      .detectSupport(renderer);
    loader.setKTX2Loader(ktx2);
    loader.setMeshoptDecoder(MeshoptDecoder);
  });
  const copy = React.useMemo(() => {
    const next = scene.clone(true);
    if (tone === "comparison") {
      next.traverse((object) => {
        const mesh = object as { material?: Material | Material[] };
        if (!mesh.material) return;
        mesh.material = Array.isArray(mesh.material)
          ? mesh.material.map(styleComparisonMaterial)
          : styleComparisonMaterial(mesh.material);
      });
    }
    return next;
  }, [scene, tone]);

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

function PivotMarker({
  position,
  color,
}: {
  position: [number, number, number];
  color: string;
}) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.012, 20, 20]} />
        <meshStandardMaterial color={color} emissive={color} />
      </mesh>
      <mesh>
        <torusGeometry args={[0.025, 0.0025, 10, 32]} />
        <meshBasicMaterial color={color} />
      </mesh>
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
  comparison,
}: {
  asset: AssetRecord;
  pose?: ViewerPose;
  lightMode: "dark" | "light";
  grid: boolean;
  resetToken: number;
  visibleParts?: Record<string, boolean>;
  deformation?: { track: TransformTrack; frame: number };
  comparison?: ViewerComparison;
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
        <Bounds fit clip observe margin={comparison ? 1.75 : 1.35}>
          {comparison ? (
            <>
              <Model
                url={asset.previewGlbUrl}
                pose={comparison.poses[0]}
                visibleParts={visibleParts}
              />
              <PivotMarker position={comparison.pivots[0]} color="#ffbd59" />
              <Model
                url={asset.previewGlbUrl}
                pose={comparison.poses[1]}
                visibleParts={visibleParts}
                tone="comparison"
              />
              <PivotMarker position={comparison.pivots[1]} color="#55c7f3" />
            </>
          ) : (
            <>
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
            </>
          )}
        </Bounds>
      </React.Suspense>
      {grid ? (
        <Grid
          position={[0, comparison ? -0.45 : -0.001, 0]}
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
  comparison,
}: {
  asset: AssetRecord;
  pose?: ViewerPose;
  visibleParts?: Record<string, boolean>;
  deformation?: { track: TransformTrack; frame: number };
  comparison?: ViewerComparison;
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
              deformation={deformation}
              comparison={comparison}
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

        {comparison ? (
          <div className="data absolute top-3 left-3 z-10 grid gap-1.5 bg-black/75 p-3 text-[0.58rem] uppercase text-white/80">
            <div className="flex items-center gap-2">
              <span className="size-2 bg-[#ffbd59]" />
              {comparison.labels[0]}
            </div>
            <div className="flex items-center gap-2">
              <span className="size-2 bg-[#55c7f3]" />
              {comparison.labels[1]}
            </div>
            <small className="mt-1 max-w-44 normal-case leading-4 text-white/55">
              {comparison.pivotLabel}
            </small>
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
