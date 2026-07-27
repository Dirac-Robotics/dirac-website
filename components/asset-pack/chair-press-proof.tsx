"use client";

import { CircleDot, Hand, RotateCcw, ScanLine } from "lucide-react";
import * as React from "react";

import { AssetViewer } from "@/components/asset-pack/asset-viewer";
import { EvidenceDrawer } from "@/components/asset-pack/evidence-drawer";
import { recordAssetPackEvent } from "@/lib/asset-pack/analytics";
import type { AssetRecord, ViewerSeatPress } from "@/lib/asset-pack/types";

const DEFAULT_POINT: [number, number, number] = [-0.636, 0.479, -0.79];
const SEAT_SELECTION_BOUNDS = {
  min: [-0.9, 0.41, -1.03] as [number, number, number],
  max: [-0.38, 0.54, -0.58] as [number, number, number],
};
const EFFECTIVE_STIFFNESS_N_M = 2_200;
const MAX_INDENTATION_M = 0.055;
const COMPRESSION_TIME_CONSTANT_S = 0.18;
const RECOVERY_TIME_CONSTANT_S = 0.85;

function getTargetIndentationM(forceN: number) {
  return Math.min(forceN / EFFECTIVE_STIFFNESS_N_M, MAX_INDENTATION_M);
}

function getContactRadiusM(forceN: number) {
  return 0.055 + 0.025 * Math.sqrt(forceN / 140);
}

export function ChairPressProof({ asset }: { asset: AssetRecord }) {
  const [forceN, setForceN] = React.useState(110);
  const [point, setPoint] = React.useState(DEFAULT_POINT);
  const [pressed, setPressed] = React.useState(false);
  const responseRef = React.useRef(0);
  const [response, setResponse] = React.useState(0);
  const [selectionMessage, setSelectionMessage] = React.useState(
    "Center seat point selected. Click another seat location to move it.",
  );

  React.useEffect(() => {
    const target = pressed ? 1 : 0;
    const timeConstant = pressed
      ? COMPRESSION_TIME_CONSTANT_S
      : RECOVERY_TIME_CONSTANT_S;
    if (Math.abs(responseRef.current - target) < 0.001) return;

    let request = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      const elapsedS = Math.min(Math.max(now - previous, 0) / 1_000, 0.25);
      previous = now;
      const blend = 1 - Math.exp(-elapsedS / timeConstant);
      let next =
        responseRef.current + (target - responseRef.current) * blend;
      if (Math.abs(next - target) < 0.001) next = target;
      responseRef.current = next;
      setResponse(next);
      if (next !== target) request = requestAnimationFrame(tick);
    };
    request = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(request);
  }, [pressed]);

  const targetIndentationM = getTargetIndentationM(forceN);
  const depthM = targetIndentationM * response;
  const contactRadiusM = getContactRadiusM(forceN);
  const appliedForceN = pressed ? forceN * response : 0;
  const status = pressed
    ? response < 0.98
      ? "compressing"
      : "load held"
    : response > 0.01
      ? "slow recovery"
      : "ready";

  const selectPoint = React.useCallback(
    (nextPoint: [number, number, number]) => {
      responseRef.current = 0;
      setResponse(0);
      setPressed(false);
      setPoint(nextPoint);
      setSelectionMessage("Press point updated on the seat surface.");
      recordAssetPackEvent("experiment_select", {
        assetSlug: asset.slug,
        experimentId: "seat-point-press",
      });
    },
    [asset.slug],
  );

  const rejectPoint = React.useCallback(() => {
    setSelectionMessage(
      "That point is outside the seat cushion. Choose an upward-facing seat area.",
    );
  }, []);

  const seatPress = React.useMemo<ViewerSeatPress>(
    () => ({
      appliedForceN,
      depthM,
      point,
      radiusM: contactRadiusM,
      selectionBounds: SEAT_SELECTION_BOUNDS,
      onInvalidPoint: rejectPoint,
      onPointSelect: selectPoint,
    }),
    [
      appliedForceN,
      contactRadiusM,
      depthM,
      point,
      rejectPoint,
      selectPoint,
    ],
  );

  const controlClass =
    "h-2 w-full cursor-pointer accent-foreground disabled:cursor-not-allowed disabled:opacity-40";
  const buttonClass =
    "data inline-flex h-10 items-center justify-center gap-2 border border-border bg-background px-3 text-[0.62rem] uppercase text-ash transition-colors hover:border-graphite hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

  function togglePress() {
    setPressed((value) => !value);
    recordAssetPackEvent("proof_play", {
      assetSlug: asset.slug,
      experimentId: "seat-point-press",
    });
  }

  function resetPress() {
    responseRef.current = 0;
    setResponse(0);
    setPressed(false);
    setPoint(DEFAULT_POINT);
    setSelectionMessage(
      "Center seat point selected. Click another seat location to move it.",
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[19rem_minmax(0,1fr)]">
      <aside className="h-fit border border-border bg-card p-4 lg:sticky lg:top-20">
        <div className="label mb-2">Seat point press</div>
        <p className="text-sm leading-6 text-body">
          Click the memory-foam seat to choose the contact point, set a load,
          then hold and release it to see localized compression and recovery.
        </p>

        <div className="mt-5 flex gap-3 border border-border bg-background p-3">
          <CircleDot className="mt-0.5 size-4 shrink-0 text-ash" />
          <span className="text-sm leading-5 text-ash">
            {selectionMessage}
            <small className="mt-1 block text-dim">
              Side and back interactions are intentionally disabled in this
              version.
            </small>
          </span>
        </div>

        <label className="mt-6 block" htmlFor="chair-press-force">
          <span className="label flex items-center justify-between gap-3">
            Applied force
            <strong className="data font-normal text-foreground">
              {forceN.toFixed(0)} N
            </strong>
          </span>
          <input
            id="chair-press-force"
            aria-label="Chair seat press force"
            className={controlClass + " mt-3"}
            type="range"
            min="20"
            max="140"
            step="5"
            value={forceN}
            onChange={(event) => setForceN(Number(event.target.value))}
          />
          <small className="mt-2 block text-xs leading-5 text-dim">
            Maps through a disclosed 2.2 kN/m effective compression prior.
            Exact force response is not yet calibrated.
          </small>
        </label>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            className={buttonClass}
            onClick={togglePress}
            aria-pressed={pressed}
          >
            <Hand className="size-4" />
            {pressed ? "Release" : "Apply force"}
          </button>
          <button className={buttonClass} onClick={resetPress}>
            <RotateCcw className="size-4" />
            Reset
          </button>
        </div>

        <div className="mt-4 flex gap-3 border border-border bg-background p-3">
          <ScanLine className="mt-0.5 size-4 shrink-0 text-ash" />
          <span className="text-sm text-ash">
            Localized memory-foam response
            <small className="mt-1 block leading-5 text-dim">
              Compact contact footprint with slower recovery after unloading.
            </small>
          </span>
        </div>
      </aside>

      <div className="grid min-w-0 gap-3">
        <div className="overflow-hidden border border-border">
          <AssetViewer
            asset={asset}
            seatPress={seatPress}
            cameraPosition={[-0.636, 1.08, 0.55]}
            target={[-0.636, 0.46, -0.79]}
          />
        </div>

        <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
          <div className="bg-card p-4">
            <span className="label">Current load</span>
            <strong className="data mt-2 block text-lg font-normal text-foreground">
              {appliedForceN.toFixed(1)} N
            </strong>
          </div>
          <div className="bg-card p-4">
            <span className="label">Indentation</span>
            <strong className="data mt-2 block text-lg font-normal text-foreground">
              {(depthM * 1_000).toFixed(1)} mm
            </strong>
          </div>
          <div className="bg-card p-4">
            <span className="label">Contact radius</span>
            <strong className="data mt-2 block text-lg font-normal text-foreground">
              {(contactRadiusM * 1_000).toFixed(0)} mm
            </strong>
          </div>
          <div className="bg-card p-4">
            <span className="label">Response</span>
            <strong className="data mt-2 block text-lg font-normal capitalize text-foreground">
              {status}
            </strong>
          </div>
        </div>

        <div className="flex gap-3 border border-border bg-card p-4 text-sm leading-6 text-body">
          <CircleDot className="mt-1 size-4 shrink-0 text-ash" />
          <p>
            The pink ring is the compact deformation footprint. The arrow
            shows the current load. On release, force drops to zero while the
            memory-foam indentation recovers more slowly.
          </p>
        </div>

        <EvidenceDrawer
          values={[
            ...asset.evidence,
            {
              label: "Compression stiffness",
              provenance: "prior-driven",
              value: "2.2 kN/m",
            },
            {
              label: "Recovery time constant",
              provenance: "prior-driven",
              value: "0.85 s",
            },
            {
              label: "Maximum indentation",
              provenance: "prior-driven",
              value: "55 mm cap",
            },
          ]}
          disclosure="Interactive localized deformation of the actual rendered seat mesh. Contact location is user-selected. Memory-foam locality, effective stiffness, and recovery are disclosed priors; the force-depth response has not been load-cell calibrated. Side, back, and rigid chair motion are outside this seat-only proof."
        />
      </div>
    </div>
  );
}
