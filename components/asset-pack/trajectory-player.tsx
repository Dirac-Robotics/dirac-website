"use client";

/* eslint-disable react-hooks/set-state-in-effect -- State is synchronized from
   an external trajectory file and playback clock. */

import { Pause, Play, RotateCcw } from "lucide-react";
import * as React from "react";

import { SignalPlot } from "@/components/asset-pack/signal-plot";
import { recordAssetPackEvent } from "@/lib/asset-pack/analytics";
import type { TransformTrack } from "@/lib/asset-pack/types";

export function TrajectoryPlayer({
  assetSlug,
  experimentId,
  trackUrl,
  onFrame,
}: {
  assetSlug: string;
  experimentId: string;
  trackUrl: string;
  onFrame: (frame: number, track: TransformTrack | null) => void;
}) {
  const [track, setTrack] = React.useState<TransformTrack | null>(null);
  const [loadError, setLoadError] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [signal, setSignal] = React.useState("");
  const startedAt = React.useRef(0);
  const progressAtStart = React.useRef(0);

  React.useEffect(() => {
    const controller = new AbortController();
    setTrack(null);
    setLoadError(false);
    setProgress(0);
    setPlaying(false);
    fetch(trackUrl, { signal: controller.signal, cache: "force-cache" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Track request failed (${response.status}).`);
        }
        return response.json();
      })
      .then((value: TransformTrack) => {
        setTrack(value);
        setSignal(Object.keys(value.signals)[0] ?? "");
      })
      .catch((error: unknown) => {
        if ((error as { name?: string }).name !== "AbortError") {
          setLoadError(true);
        }
      });
    return () => controller.abort();
  }, [trackUrl]);

  const frameCount = React.useMemo(() => {
    if (!track) return 0;
    return (
      track.transform?.position.length ??
      track.pca?.weights.length ??
      Object.values(track.signals)[0]?.values.length ??
      0
    );
  }, [track]);

  React.useEffect(() => {
    onFrame(Math.round(progress * Math.max(frameCount - 1, 0)), track);
  }, [frameCount, onFrame, progress, track]);

  React.useEffect(() => {
    if (!playing || !track) return;
    startedAt.current = performance.now();
    progressAtStart.current = progress;
    let request = 0;
    const tick = (now: number) => {
      const elapsed = (now - startedAt.current) / 1000;
      const next =
        progressAtStart.current +
        elapsed / Math.max(track.duration, 0.001);
      if (next >= 1) {
        setProgress(1);
        setPlaying(false);
        return;
      }
      setProgress(next);
      request = requestAnimationFrame(tick);
    };
    request = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(request);
  }, [playing, progress, track]);

  function togglePlayback() {
    if (!track) return;
    if (progress >= 1) setProgress(0);
    setPlaying((value) => !value);
    recordAssetPackEvent("proof_play", {
      assetSlug,
      experimentId,
    });
  }

  if (loadError) {
    return (
      <div className="border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        The authoritative trajectory could not be loaded.
      </div>
    );
  }
  if (!track) {
    return (
      <div className="data border border-border bg-background p-4 text-[0.65rem] uppercase text-dim">
        Loading authoritative trajectory
      </div>
    );
  }

  const signalRecord = track.signals[signal];
  const buttonClass =
    "inline-flex size-9 items-center justify-center border border-border bg-card text-foreground transition-colors hover:border-graphite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

  return (
    <div className="grid gap-3 border border-border bg-card p-3">
      <div className="flex items-center gap-2">
        <button
          className={buttonClass}
          onClick={togglePlayback}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </button>
        <button
          className={buttonClass}
          onClick={() => {
            setPlaying(false);
            setProgress(0);
          }}
          aria-label="Restart"
        >
          <RotateCcw className="size-4" />
        </button>
        <input
          className="h-8 min-w-0 flex-1 accent-foreground"
          type="range"
          min="0"
          max="1"
          step={1 / Math.max(frameCount - 1, 1)}
          value={progress}
          aria-label="Trajectory time"
          onChange={(event) => {
            setPlaying(false);
            setProgress(Number(event.target.value));
          }}
          onPointerUp={() =>
            recordAssetPackEvent("proof_scrub", {
              assetSlug,
              experimentId,
            })
          }
          onKeyUp={() =>
            recordAssetPackEvent("proof_scrub", {
              assetSlug,
              experimentId,
            })
          }
        />
        <time className="data w-14 text-right text-xs text-ash">
          {(progress * track.duration).toFixed(2)} s
        </time>
      </div>

      {signalRecord ? (
        <SignalPlot
          values={signalRecord.values}
          progress={progress}
          label={signal.replaceAll("_", " ")}
          unit={signalRecord.unit}
        />
      ) : null}

      <div
        className="flex flex-wrap gap-1"
        role="tablist"
        aria-label="Trajectory metrics"
      >
        {Object.entries(track.signals).map(([key, value]) => (
          <button
            className="data border border-border px-2.5 py-1.5 text-[0.6rem] uppercase text-dim aria-selected:border-ash aria-selected:text-foreground"
            role="tab"
            aria-selected={signal === key}
            key={key}
            onClick={() => setSignal(key)}
          >
            {key.replaceAll("_", " ")}{" "}
            <span className="text-dim">{value.unit}</span>
          </button>
        ))}
      </div>
      <p className="data text-[0.58rem] uppercase text-dim">
        60 Hz web track · source: {track.source}
      </p>
    </div>
  );
}
