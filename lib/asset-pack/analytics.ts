"use client";

export type AssetPackEvent =
  | "viewer_open"
  | "proof_play"
  | "proof_scrub"
  | "download_gate_open"
  | "download_unlocked"
  | "experiment_select";

let serverAnalyticsEnabled = false;

export function configureAssetPackAnalytics(enabled: boolean) {
  serverAnalyticsEnabled = enabled;
}

function sessionId(): string {
  const key = "dirac:asset-pack-session";
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const next = crypto.randomUUID();
  window.sessionStorage.setItem(key, next);
  return next;
}

export function recordAssetPackEvent(
  event: AssetPackEvent,
  fields: Record<string, string | number | boolean> = {},
) {
  if (typeof window === "undefined") return;
  const payload = {
    event,
    sessionId: sessionId(),
    path: window.location.pathname,
    assetSlug: typeof fields.assetSlug === "string" ? fields.assetSlug : undefined,
    bundleId: typeof fields.bundleId === "string" ? fields.bundleId : undefined,
    experimentId:
      typeof fields.experimentId === "string" ? fields.experimentId : undefined,
  };
  window.dispatchEvent(
    new CustomEvent("asset-pack:analytics", { detail: payload }),
  );
  if (serverAnalyticsEnabled && navigator.sendBeacon) {
    navigator.sendBeacon(
      "/api/asset-events",
      new Blob([JSON.stringify(payload)], { type: "application/json" }),
    );
  }
}
