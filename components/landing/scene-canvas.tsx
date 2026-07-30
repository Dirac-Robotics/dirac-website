"use client";

import * as React from "react";
import { RotateCcw } from "lucide-react";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import {
  Bounds,
  Html,
  OrbitControls,
  useProgress,
} from "@react-three/drei";
import * as THREE from "three";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";

import { useCanvasProfile } from "@/components/assets/canvas-profile";
import { StudioRig } from "@/components/assets/glb-display";

class SceneErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function LoadingProgress() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="min-w-36 border border-border bg-background/95 px-4 py-3 text-center backdrop-blur-sm">
        <div className="data text-[0.65rem] uppercase text-dim">
          Loading scene
        </div>
        <div className="data mt-1 text-sm text-foreground">
          {Math.round(progress)}%
        </div>
      </div>
    </Html>
  );
}

function ReconstructedScene({ url }: { url: string }) {
  const renderer = useThree((state) => state.gl);
  const { scene } = useLoader(GLTFLoader, url, (loader) => {
    const ktx2 = new KTX2Loader()
      .setTranscoderPath("/asset-pack/basis/")
      .detectSupport(renderer);
    loader.setKTX2Loader(ktx2);
    loader.setMeshoptDecoder(MeshoptDecoder);
  });

  const object = React.useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });
    return clone;
  }, [scene]);

  return (
    <Bounds fit clip observe margin={1.08}>
      <primitive object={object} />
    </Bounds>
  );
}

export default function SceneCanvas({
  url,
  onError,
}: {
  url: string;
  onError: () => void;
}) {
  const { dpr, shadows } = useCanvasProfile();
  const [resetKey, setResetKey] = React.useState(0);

  return (
    <SceneErrorBoundary onError={onError}>
      <Canvas
        key={resetKey}
        className="absolute! inset-0"
        dpr={dpr}
        shadows={shadows}
        camera={{ position: [4, 3, 6], fov: 42, near: 0.01, far: 500 }}
        gl={{ antialias: true, alpha: false }}
        style={{ touchAction: "none" }}
        onCreated={({ gl }) => {
          gl.setClearColor("#050508");
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.15;
        }}
      >
        <StudioRig shadows={shadows} />
        <React.Suspense fallback={<LoadingProgress />}>
          <ReconstructedScene url={url} />
        </React.Suspense>
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minPolarAngle={0.15}
          maxPolarAngle={Math.PI / 2.02}
          zoomToCursor
        />
      </Canvas>
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-background/80 px-3 py-2 backdrop-blur-sm">
        <span className="pointer-events-none data text-[0.6rem] uppercase text-dim">
          Drag to orbit · Scroll or pinch to zoom
        </span>
        <button
          type="button"
          onClick={() => setResetKey((value) => value + 1)}
          className="data inline-flex shrink-0 items-center gap-1.5 text-[0.6rem] uppercase text-ash transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <RotateCcw className="size-3" />
          Reset view
        </button>
      </div>
    </SceneErrorBoundary>
  );
}
