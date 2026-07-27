"use client";

import * as React from "react";

/**
 * Device-aware render profile for the R3F canvases. Computed once, synchronously,
 * at mount. These canvases are client-only (ssr:false), so `window` is available
 * on first render and the value never flips mid-session (avoids re-creating the
 * WebGL context). Low-power devices (touch, small screens, few cores) drop the
 * pixel ratio and shadows, which are the two biggest costs on mobile GPUs.
 */
export type CanvasProfile = {
  lowPower: boolean;
  dpr: [number, number];
  shadows: boolean;
};

function compute(): CanvasProfile {
  if (typeof window === "undefined") {
    return { lowPower: false, dpr: [1, 2], shadows: true };
  }
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const small = window.matchMedia("(max-width: 767px)").matches;
  const fewCores = (navigator.hardwareConcurrency ?? 8) <= 4;
  const lowPower = coarse || small || fewCores;
  return lowPower
    ? { lowPower: true, dpr: [1, 1.25], shadows: false }
    : { lowPower: false, dpr: [1, 2], shadows: true };
}

export function useCanvasProfile(): CanvasProfile {
  const [profile] = React.useState<CanvasProfile>(compute);
  return profile;
}
