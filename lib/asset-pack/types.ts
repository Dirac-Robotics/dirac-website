export type Provenance =
  | "measured"
  | "fitted"
  | "prior-driven"
  | "unvalidated";

export type CompatibilityBadge = {
  label: string;
  status: "verified" | "compatible" | "experimental" | "not-verified";
  detail: string;
};

export type EvidenceValue = {
  label: string;
  value: string;
  provenance: Provenance;
  uncertainty?: string;
};

export type ExperimentPreset = {
  id: string;
  label: string;
  trackUrl: string;
  disclosure: string;
  metrics: EvidenceValue[];
};

export type ExperimentDefinition = {
  id: string;
  title: string;
  description: string;
  kind: "rigid-transform" | "comparison" | "pca-deformation";
  presets: ExperimentPreset[];
};

export type AssetFile = {
  label: string;
  format: "GLB" | "OpenUSD" | "ZIP" | "JSON" | "MP4";
  size: string;
  role: string;
};

export type AssetRecord = {
  slug: string;
  title: string;
  version: string;
  description: string;
  posterUrl: string;
  previewGlbUrl: string;
  bundleId: string;
  evidenceTier: "quantitative" | "calibrated-estimate" | "experimental";
  disclosure: string;
  dimensions: string;
  mass: string;
  preview: {
    cameraPosition: [number, number, number];
    target: [number, number, number];
    gridSize: number;
    canonicalTransform: number[];
  };
  compatibility: CompatibilityBadge[];
  evidence: EvidenceValue[];
  files: AssetFile[];
  experiments: ExperimentDefinition[];
};

export type AssetPackManifest = {
  schema: "asset-pack.web.v1";
  version: string;
  headline: string;
  releaseStatus: "evaluation-only-beta";
  termsVersion: string;
  capabilities: {
    downloads: boolean;
    serverAnalytics: boolean;
    contactUrl: string;
  };
  generatedAt: string;
  assets: AssetRecord[];
};

export type TransformTrack = {
  schema: "asset-pack.track.v1";
  fps: number;
  duration: number;
  source: string;
  provenance: Provenance;
  transform?: {
    position: number[][];
    quaternion: number[][];
  };
  comparison?: {
    labels: string[];
    values: number[][];
  };
  signals: Record<string, { unit: string; values: number[] }>;
  pca?: {
    vertexCount: number;
    modeCount: number;
    rest: number[];
    modes: number[][];
    weights: number[][];
    faces: number[];
    rmseM: number;
    displayAlignment?: {
      method: "nearest-visual-surface";
      source: string;
      maxDistanceM: number;
    };
  };
};

export type ViewerPose = {
  position: [number, number, number];
  quaternion: [number, number, number, number];
};

export type ViewerComparison = {
  labels: [string, string];
  poses: [ViewerPose, ViewerPose];
  pivots: [[number, number, number], [number, number, number]];
  pivotLabel: string;
};
