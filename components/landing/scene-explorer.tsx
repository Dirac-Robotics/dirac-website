"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Box, Rotate3D } from "lucide-react";

import { Button } from "@/components/ui/button";

const SceneCanvas = dynamic(() => import("./scene-canvas"), {
  ssr: false,
  loading: () => <SceneLoading label="Loading viewer" />,
});

type SceneExplorerProps = {
  sceneUrl: string;
  posterUrl: string;
};

export function SceneExplorer({
  sceneUrl,
  posterUrl,
}: SceneExplorerProps) {
  const [active, setActive] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  if (!active || failed) {
    return (
      <div className="relative aspect-video min-h-72 overflow-hidden bg-(--void)">
        {/* A real render remains useful when WebGL is unavailable. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={posterUrl}
          alt="Rendered reconstruction of the captured deployment scene"
          className="absolute inset-0 size-full object-cover"
        />
        <div
          className="absolute inset-0 bg-background/45"
          aria-hidden="true"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <span className="flex size-11 items-center justify-center rounded-full border border-border bg-background/85 text-foreground">
            <Box className="size-5" />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">
              {failed ? "Interactive viewer unavailable" : "Explore the scene"}
            </p>
            <p className="ui-text mt-1">
              {failed
                ? "The rendered reconstruction is shown instead."
                : "Loads the full 3D reconstruction on demand."}
            </p>
          </div>
          {!failed ? (
            <Button
              type="button"
              variant="outline"
              className="h-10 gap-2 bg-background/90 px-4"
              onClick={() => setActive(true)}
            >
              <Rotate3D className="size-4" />
              Open 3D viewer
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video min-h-72 overflow-hidden bg-(--void)">
      <SceneCanvas url={sceneUrl} onError={() => setFailed(true)} />
    </div>
  );
}

function SceneLoading({ label }: { label: string }) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-(--void)"
      role="status"
    >
      <span className="relative flex size-2.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-foreground/30" />
        <span className="relative inline-flex size-2.5 rounded-full bg-foreground/60" />
      </span>
      <span className="data text-[0.65rem] uppercase text-dim">{label}</span>
    </div>
  );
}
