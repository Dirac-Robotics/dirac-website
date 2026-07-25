"use client";

import dynamic from "next/dynamic";

/**
 * Client wrapper for a single-object gallery preview. The WebGL canvas cannot
 * server-render, so it loads lazily (ssr: false) behind a light placeholder.
 * Kept separate from the canvas module so three.js stays in its own chunk.
 */

type ObjType = "obj" | "fbx" | "dae";

const ObjectCardCanvas = dynamic(() => import("./object-card-canvas"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-foreground/30" />
        <span className="relative inline-flex size-2 rounded-full bg-foreground/60" />
      </span>
    </div>
  ),
});

export function ObjectPreview(props: {
  url: string;
  type: ObjType;
  rotation?: [number, number, number];
  fit?: number;
}) {
  return <ObjectCardCanvas {...props} />;
}
