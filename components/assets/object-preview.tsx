"use client";

import * as React from "react";
import dynamic from "next/dynamic";

/**
 * Client wrapper for a single-object gallery preview. The WebGL canvas cannot
 * server-render, so it loads lazily (ssr: false) behind a light placeholder,
 * and only once the card scrolls near the viewport — so the four gallery
 * canvases are not all created up front (a real cost on mobile GPUs).
 */

type ObjType = "obj" | "fbx" | "dae";

function Placeholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-foreground/30" />
        <span className="relative inline-flex size-2 rounded-full bg-foreground/60" />
      </span>
    </div>
  );
}

const ObjectCardCanvas = dynamic(() => import("./object-card-canvas"), {
  ssr: false,
  loading: () => <Placeholder />,
});

export function ObjectPreview(props: {
  url: string;
  type: ObjType;
  rotation?: [number, number, number];
  fit?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time fallback when IntersectionObserver is unavailable
      setShow(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="absolute inset-0">
      {show ? <ObjectCardCanvas {...props} /> : <Placeholder />}
    </div>
  );
}
