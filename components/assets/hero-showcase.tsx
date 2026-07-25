"use client";

import * as React from "react";
import dynamic from "next/dynamic";

/**
 * Client wrapper for the 3D showcase. The WebGL canvas cannot server-render, so
 * it is loaded lazily (ssr: false) behind a light placeholder. Shows the
 * centered model's name and a one-line interaction hint.
 */

// Kept in sync with OBJECTS order in showcase-canvas.tsx. Duplicated here so the
// server/client wrapper does not pull three.js into its own chunk.
const NAMES = ["Eyewear", "Lounge chair", "Kettle", "Rubber duck"];

const ShowcaseCanvas = dynamic(() => import("./showcase-canvas"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <span className="relative flex size-2.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-foreground/30" />
        <span className="relative inline-flex size-2.5 rounded-full bg-foreground/60" />
      </span>
    </div>
  ),
});

export function HeroShowcase({ className = "" }: { className?: string }) {
  const [active, setActive] = React.useState(0);
  const [cursor, setCursor] = React.useState("");

  return (
    <div className={"relative " + className} style={{ cursor }}>
      <ShowcaseCanvas onActiveChange={setActive} onCursor={setCursor} />

      {/* Label + interaction hint. Non-interactive so it never blocks the canvas. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-1 flex flex-col items-center gap-1">
        <span className="data text-xs tracking-[0.16em] text-ash uppercase">
          {NAMES[active] ?? ""}
        </span>
        <span className="ui-text text-[0.7rem] text-dim">
          Drag the center object to rotate
        </span>
      </div>
    </div>
  );
}
