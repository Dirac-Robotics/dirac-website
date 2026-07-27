"use client";

import { Layers3, ScanLine } from "lucide-react";
import * as React from "react";

import { AssetViewer } from "@/components/asset-pack/asset-viewer";
import { EvidenceDrawer } from "@/components/asset-pack/evidence-drawer";
import { TrajectoryPlayer } from "@/components/asset-pack/trajectory-player";
import { recordAssetPackEvent } from "@/lib/asset-pack/analytics";
import type {
  AssetRecord,
  TransformTrack,
  ViewerComparison,
  ViewerPose,
} from "@/lib/asset-pack/types";

const HAMMER_BALANCE_PIVOT = [
  0.2388560182163568,
  0.010498220113394668,
  -0.00030231248636543073,
] as const;
const HAMMER_GRIP_PIVOT = [0.08, 0, 0] as const;

function hammerPoseAroundPivot(
  angle: number,
  laneOffsetY: number,
  pivot: readonly [number, number, number],
): { pose: ViewerPose; pivot: [number, number, number] } {
  const [pivotX, pivotY, pivotZ] = pivot;
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  const rotatedPivotX = cosine * pivotX - sine * pivotY;
  const rotatedPivotY = sine * pivotX + cosine * pivotY;
  return {
    pose: {
      position: [
        pivotX - rotatedPivotX,
        pivotY - rotatedPivotY + laneOffsetY,
        pivotZ,
      ],
      quaternion: [0, 0, Math.sin(angle / 2), Math.cos(angle / 2)],
    },
    pivot: [pivotX, pivotY + laneOffsetY, pivotZ],
  };
}

export function PhysicsProof({ asset }: { asset: AssetRecord }) {
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
  const [comparison, setComparison] = React.useState<
    ViewerComparison | undefined
  >();
  const [deformation, setDeformation] = React.useState<
    { track: TransformTrack; frame: number } | undefined
  >();
  const [parts, setParts] = React.useState<Record<string, boolean>>({
    steel: true,
    wood: true,
    glass: true,
    metal: true,
  });

  const onFrame = React.useCallback(
    (frame: number, track: TransformTrack | null) => {
      if (asset.slug === "hammer" && track?.comparison) {
        const values = track.comparison.values[frame] ?? [0, 0];
        const isPendulum = preset?.id === "pendulum";
        const pivot = isPendulum
          ? HAMMER_GRIP_PIVOT
          : HAMMER_BALANCE_PIVOT;
        const partAware = hammerPoseAroundPivot(values[0] ?? 0, 0.2, pivot);
        const uniform = hammerPoseAroundPivot(values[1] ?? 0, -0.2, pivot);
        const labels: [string, string] = [
          track.comparison.labels[0] ?? "part-aware composite",
          track.comparison.labels[1] ?? "same-mass uniform",
        ];
        setComparison({
          labels,
          poses: [partAware.pose, uniform.pose],
          pivots: [partAware.pivot, uniform.pivot],
          pivotLabel: isPendulum
            ? "Shared pivot at the measured grip station (0.08 m)"
            : "Shared pivot at the fitted part-aware center of mass",
        });
        setPose(undefined);
        setDeformation(undefined);
        return;
      }

      setComparison(undefined);
      setDeformation(track?.pca ? { track, frame } : undefined);
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
    [asset.slug, preset?.id],
  );

  const partOptions = React.useMemo(() => {
    if (asset.slug === "hammer") return ["steel", "wood"];
    if (asset.slug === "table") return ["glass", "metal"];
    return [];
  }, [asset.slug]);

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
              The purple surface shows the PCA deformation field projected
              onto the chair shell. The original PBR mesh remains visible
              beneath it.
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
          <AssetViewer
            asset={asset}
            pose={pose}
            visibleParts={parts}
            deformation={deformation}
            comparison={comparison}
          />
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
