"use client";

import { ArrowDown, Pause, Play, RotateCcw, ScanLine } from "lucide-react";
import * as React from "react";

import { AssetViewer } from "@/components/asset-pack/asset-viewer";
import { EvidenceDrawer } from "@/components/asset-pack/evidence-drawer";
import { recordAssetPackEvent } from "@/lib/asset-pack/analytics";
import {
  GRAVITY_M_S2,
  HAMMER_COM_STATION_M,
  HAMMER_DEFAULT_PIVOT_M,
  HAMMER_DEFAULT_RELEASE_DEG,
  getHammerPendulumView,
  getPendulumEnergyJ,
  getPendulumProperties,
  integratePendulumRk4,
  type PendulumState,
} from "@/lib/asset-pack/hammer-pendulum";
import type { AssetRecord } from "@/lib/asset-pack/types";

const FIXED_TIMESTEP_S = 1 / 480;

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180;
}

function radiansToDegrees(value: number) {
  return (value * 180) / Math.PI;
}

export function HammerGravityProof({ asset }: { asset: AssetRecord }) {
  const [releaseAngleDeg, setReleaseAngleDeg] = React.useState(
    HAMMER_DEFAULT_RELEASE_DEG,
  );
  const [pivotStationM, setPivotStationM] = React.useState(
    HAMMER_DEFAULT_PIVOT_M,
  );
  const initialState = React.useMemo<PendulumState>(
    () => ({
      thetaRad: degreesToRadians(HAMMER_DEFAULT_RELEASE_DEG),
      omegaRadS: 0,
    }),
    [],
  );
  const stateRef = React.useRef(initialState);
  const [state, setState] = React.useState(initialState);
  const [playing, setPlaying] = React.useState(false);

  const resetToRelease = React.useCallback(
    (angleDeg = releaseAngleDeg) => {
      const next = {
        thetaRad: degreesToRadians(angleDeg),
        omegaRadS: 0,
      };
      stateRef.current = next;
      setState(next);
      setPlaying(false);
    },
    [releaseAngleDeg],
  );

  React.useEffect(() => {
    if (!playing) return;
    let previous = performance.now();
    let accumulatorS = 0;
    let request = 0;
    const tick = (now: number) => {
      accumulatorS += Math.min(Math.max(0, now - previous) / 1000, 0.05);
      previous = now;
      let next = stateRef.current;
      while (accumulatorS >= FIXED_TIMESTEP_S) {
        next = integratePendulumRk4(
          next,
          pivotStationM,
          FIXED_TIMESTEP_S,
        );
        accumulatorS -= FIXED_TIMESTEP_S;
      }
      stateRef.current = next;
      setState(next);
      request = requestAnimationFrame(tick);
    };
    request = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(request);
  }, [pivotStationM, playing]);

  const view = React.useMemo(
    () => getHammerPendulumView(state.thetaRad, pivotStationM),
    [pivotStationM, state.thetaRad],
  );
  const properties = React.useMemo(
    () =>
      getPendulumProperties(
        pivotStationM,
        degreesToRadians(releaseAngleDeg),
      ),
    [pivotStationM, releaseAngleDeg],
  );
  const energyJ = getPendulumEnergyJ(state, pivotStationM);
  const controlClass =
    "h-2 w-full cursor-pointer accent-foreground disabled:cursor-not-allowed disabled:opacity-40";
  const buttonClass =
    "data inline-flex h-10 items-center justify-center gap-2 border border-border bg-background px-3 text-[0.62rem] uppercase text-ash transition-colors hover:border-graphite hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

  function changeReleaseAngle(nextAngleDeg: number) {
    setReleaseAngleDeg(nextAngleDeg);
    resetToRelease(nextAngleDeg);
  }

  function changePivot(nextPivotM: number) {
    setPivotStationM(nextPivotM);
    resetToRelease();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[19rem_minmax(0,1fr)]">
      <aside className="h-fit border border-border bg-card p-4 lg:sticky lg:top-20">
        <div className="label mb-2">Gravity pendulum</div>
        <p className="text-sm leading-6 text-body">
          Pin the hammer at any station, choose its release angle, then let
          gravity act on the fitted center of mass and inertia.
        </p>

        <label className="mt-6 block" htmlFor="hammer-release-angle">
          <span className="label flex items-center justify-between gap-3">
            Release angle
            <strong className="data font-normal text-foreground">
              {releaseAngleDeg.toFixed(0)}°
            </strong>
          </span>
          <input
            id="hammer-release-angle"
            aria-label="Hammer release angle"
            className={`${controlClass} mt-3`}
            type="range"
            min="0"
            max="80"
            step="1"
            value={releaseAngleDeg}
            onChange={(event) => changeReleaseAngle(Number(event.target.value))}
          />
          <small className="mt-2 block text-xs leading-5 text-dim">
            0° hangs straight down; larger values store more gravitational
            potential energy.
          </small>
        </label>

        <label className="mt-6 block" htmlFor="hammer-pivot-station">
          <span className="label flex items-center justify-between gap-3">
            Rotation point
            <strong className="data font-normal text-foreground">
              {pivotStationM.toFixed(3)} m
            </strong>
          </span>
          <input
            id="hammer-pivot-station"
            aria-label="Hammer rotation point"
            className={`${controlClass} mt-3`}
            type="range"
            min="0.02"
            max="0.30"
            step="0.001"
            value={pivotStationM}
            onChange={(event) => changePivot(Number(event.target.value))}
          />
          <small className="mt-2 block text-xs leading-5 text-dim">
            Station is measured from the handle butt. The fitted COM is at
            0.239 m.
          </small>
        </label>

        <button
          className={`${buttonClass} mt-3 w-full`}
          onClick={() => changePivot(HAMMER_COM_STATION_M)}
          aria-pressed={properties.neutral}
        >
          Place pivot at COM
        </button>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            className={buttonClass}
            onClick={() => {
              setPlaying((value) => !value);
              recordAssetPackEvent("proof_play", {
                assetSlug: asset.slug,
                experimentId: "gravity-pendulum",
              });
            }}
          >
            {playing ? (
              <Pause className="size-4" />
            ) : (
              <Play className="size-4" />
            )}
            {playing ? "Pause" : "Play"}
          </button>
          <button className={buttonClass} onClick={() => resetToRelease()}>
            <RotateCcw className="size-4" />
            Reset
          </button>
        </div>

        <div className="mt-4 flex gap-3 border border-border bg-background p-3">
          <ArrowDown className="mt-0.5 size-4 shrink-0 text-ash" />
          <span className="text-sm text-ash">
            Gravity: {GRAVITY_M_S2.toFixed(2)} m/s²
            <small className="mt-1 block leading-5 text-dim">
              Ideal frictionless pin joint; no motor, contact, or scripted
              trajectory.
            </small>
          </span>
        </div>
      </aside>

      <div className="grid min-w-0 gap-3">
        <div className="overflow-hidden border border-border">
          <AssetViewer
            asset={asset}
            pose={view.pose}
            markers={view.markers}
            target={[0.165, 0.18, 0]}
          />
        </div>

        <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
          <div className="bg-card p-4">
            <span className="label">Current angle</span>
            <strong className="data mt-2 block text-lg font-normal text-foreground">
              {radiansToDegrees(state.thetaRad).toFixed(1)}°
            </strong>
          </div>
          <div className="bg-card p-4">
            <span className="label">Pivot to COM</span>
            <strong className="data mt-2 block text-lg font-normal text-foreground">
              {properties.distanceToComM.toFixed(3)} m
            </strong>
          </div>
          <div className="bg-card p-4">
            <span className="label">Predicted period</span>
            <strong className="data mt-2 block text-lg font-normal text-foreground">
              {properties.periodS ? `${properties.periodS.toFixed(2)} s` : "neutral"}
            </strong>
          </div>
          <div className="bg-card p-4">
            <span className="label">Mechanical energy</span>
            <strong className="data mt-2 block text-lg font-normal text-foreground">
              {energyJ.toFixed(3)} J
            </strong>
          </div>
        </div>

        <div className="flex gap-3 border border-border bg-card p-4 text-sm leading-6 text-body">
          <ScanLine className="mt-1 size-4 shrink-0 text-ash" />
          <p>
            The amber marker is the user-controlled pivot. The pink marker is
            the fitted composite COM. At the COM, gravity produces no angular
            acceleration; farther away, the same hammer swings according to
            its parallel-axis inertia.
          </p>
        </div>

        <EvidenceDrawer
          values={[
            ...asset.evidence,
            {
              label: "Inertia about COM",
              provenance: "fitted",
              value: "0.00551 kg·m²",
            },
            {
              label: "Release torque",
              provenance: "fitted",
              value: `${properties.releaseTorqueNm.toFixed(3)} N·m`,
            },
          ]}
          disclosure="Interactive ideal physical-pendulum integration at 480 Hz. Mass, COM, and inertia use the disclosed hammer priors and fitted composite properties; gravity is 9.81 m/s²."
        />
      </div>
    </div>
  );
}
