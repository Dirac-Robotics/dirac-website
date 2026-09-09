"use client";

import * as React from "react";
import { Play } from "lucide-react";

export function PipelineVideo({ src, poster }: { src: string; poster: string }) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [started, setStarted] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  async function play() {
    const video = videoRef.current;
    if (!video) return;
    try {
      await video.play();
    } catch {
      setFailed(true);
    }
  }

  return (
    <div className="relative aspect-video bg-(--void)">
      <video
        ref={videoRef}
        className="block aspect-video h-auto w-full object-contain"
        controls
        playsInline
        preload="metadata"
        poster={poster}
        src={src}
        aria-label="Real2Sim pipeline demo: from camera capture to simulation"
        onPlay={() => {
          setStarted(true);
          setFailed(false);
        }}
        onError={() => setFailed(true)}
      >
        Your browser does not support embedded video.
      </video>
      {!started && !failed ? (
        <button
          type="button"
          onClick={play}
          aria-label="Play pipeline demo"
          className="absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-background/85 text-foreground shadow-lg transition-colors hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <Play className="ml-1 size-6" fill="currentColor" />
        </button>
      ) : null}
      {failed ? (
        <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/95 p-6 text-center text-sm text-ash">
          <p>The video could not be played here.</p>
          <a href={src} className="underline underline-offset-4">
            Open the video directly
          </a>
        </div>
      ) : null}
    </div>
  );
}
