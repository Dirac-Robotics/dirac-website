import "server-only";

export const ASSET_PACK_TERMS_VERSION = "evaluation-beta-v1";

export const assetBundleMap = {
  "purple-chair": {
    storageKey: "asset-pack/0.1.0-beta.1/purple-chair-0.1.0-beta.1.zip",
    filename: "purple-chair-0.1.0-beta.1.zip",
  },
  table: {
    storageKey: "asset-pack/0.1.0-beta.1/table-0.1.0-beta.1.zip",
    filename: "table-0.1.0-beta.1.zip",
  },
  "hammer-v2": {
    storageKey: "asset-pack/0.1.0-beta.1/hammer-v2-0.1.0-beta.1.zip",
    filename: "hammer-v2-0.1.0-beta.1.zip",
  },
  "all-assets": {
    storageKey: "asset-pack/0.1.0-beta.1/all-assets-0.1.0-beta.1.zip",
    filename: "all-assets-0.1.0-beta.1.zip",
  },
} as const;

export type AssetBundleId = keyof typeof assetBundleMap;
