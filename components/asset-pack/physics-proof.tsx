"use client";

import { Layers3, ScanLine } from "lucide-react";
import * as React from "react";

import { AssetViewer } from "@/components/asset-pack/asset-viewer";
import { EvidenceDrawer } from "@/components/asset-pack/evidence-drawer";
import { HammerGravityProof } from "@/components/asset-pack/hammer-gravity-proof";
import { TrajectoryPlayer } from "@/components/asset-pack/trajectory-player";
import { recordAssetPackEvent } from "@/lib/asset-pack/analytics";
import type {
  AssetRecord,
  TransformTrack,
  ViewerPose,
} from "@/lib/asset-pack/types";

export function PhysicsProof({ asset }: { asset: AssetRecord }) {
  return asset.slug === "hammer" ? (
    <HammerGravityProof asset={asset} />
  ) : (
    <TrackedPhysicsProof asset={asset} />
  );
}

function TrackedPhysicsProof({ asset }: { asset: AssetRecord }) {
  const [experimentId, setExperimentId] = React.useState(
    asset.experiments[0]?.id ?? "",
  );
  const experiment =
    asset.experiments.find((item) => item.id === experimentId) ??
    asset.experiments[0];
  const [presetId, setPresetId] = React.useState(
    experiment?.presets[0]?.id ?? "",
  );
  const preset =
    experiment?.presets.find((item) => item.id === presetId) ??
    experiment?.presets[0];
  const [pose, setPose] = React.useState<ViewerPose | undefined>();
  const [parts, setParts] = React.useState<Record<string, boolean>>({
    glass: true,
    metal: true,
  });

  const onFrame = React.useCallback(
    (frame: number, track: TransformTrack | null) => {
      if (!track?.transform) {
        setPose(undefined);
        return;
      }
      const position = track.transform.position[frame] as
        | [number, number, number]
        | undefined;
      const quaternion = track.transform.quaternion[frame] as
        | [number, number, number, number]
        | undefined;
      if (position && quaternion) setPose({ position, quaternion });
    },
    [],
  );

  const partOptions = React.useMemo(
    () => (asset.slug === "table" ? ["glass", "metal"] : []),
    [asset.slug],
  );

  if (!experiment || !preset) {
    return (
      <div className="border border-border bg-card p-8 text-center text-body">
        Proof tracks are coming soon.
      </div>
    );
  }

  const segmentClass =
    "data border border-border px-3 py-2 text-[0.62rem] uppercase text-dim transition-colors hover:border-graphite aria-pressed:border-ash aria-pressed:bg-muted aria-pressed:text-foreground";

  return (
    <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <aside className="h-fit border border-border bg-card p-4 lg:sticky lg:top-20">
        <div className="label mb-2">Experiment</div>
        <div className="grid gap-1">
          {asset.experiments.map((item) => (
            <button
              className={segmentClass}
              key={item.id}
              aria-pressed={item.id === experiment.id}
              onClick={() => {
                setExperimentId(item.id);
                setPresetId(item.presets[0]?.id ?? "");
                recordAssetPackEvent("experiment_select", {
                  assetSlug: asset.slug,
                  experimentId: item.id,
                });
              }}
            >
              {item.title}
            </button>
          ))}
        </div>
        <p className="mt-4 text-sm leading-6 text-body">
          {experiment.description}
        </p>

        <div className="label mt-6 mb-2">Validated preset</div>
        <div className="flex flex-wrap gap-1">
          {experiment.presets.map((item) => (
            <button
              className={segmentClass}
              key={item.id}
              aria-pressed={item.id === preset.id}
              onClick={() => setPresetId(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {partOptions.length ? (
          <>
            <div className="label mt-6 mb-2">Render regions</div>
            <div className="grid grid-cols-2 gap-2">
              {partOptions.map((part) => (
                <label
                  className="data flex items-center gap-2 border border-border p-2 text-[0.62rem] uppercase text-ash"
                  key={part}
                >
                  <input
                    className="accent-foreground"
                    type="checkbox"
                    checked={parts[part]}
                    onChange={(event) =>
                      setParts((value) => ({
                        ...value,
                        [part]: event.target.checked,
                      }))
                    }
                  />
                  <span>{part}</span>
                </label>
              ))}
            </div>
          </>
        ) : (
          <div className="mt-6 flex gap-3 border border-border p-3 text-sm leading-5 text-body">
            <Layers3 className="mt-0.5 size-4 shrink-0 text-ash" />
            <span>
              The original chair is shown without a proxy mesh overlay. The
              response track below remains available for quantitative review.
            </span>
          </div>
        )}

        <div className="mt-4 flex gap-3 border border-border bg-background p-3">
          <ScanLine className="mt-0.5 size-4 shrink-0 text-ash" />
          <span className="text-sm text-ash">
            Offline solver result
            <small className="mt-1 block leading-5 text-dim">
              This player does not run a browser physics solver.
            </small>
          </span>
        </div>
      </aside>

      <div className="grid min-w-0 gap-3">
        <div className="overflow-hidden border border-border">
          <AssetViewer asset={asset} pose={pose} visibleParts={parts} />
        </div>
        <TrajectoryPlayer
          assetSlug={asset.slug}
          experimentId={experiment.id}
          trackUrl={preset.trackUrl}
          onFrame={onFrame}
          key={preset.trackUrl}
        />
        <EvidenceDrawer
          values={[...asset.evidence, ...preset.metrics]}
          disclosure={preset.disclosure}
        />
      </div>
    </div>
  );
}
