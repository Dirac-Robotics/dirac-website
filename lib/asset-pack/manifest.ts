import type { AssetPackManifest } from "@/lib/asset-pack/types";

export async function fetchAssetPackManifest(
  manifestUrl: string,
): Promise<AssetPackManifest> {
  const response = await fetch(manifestUrl, { cache: "force-cache" });
  if (!response.ok) {
    throw new Error(`Asset manifest request failed (${response.status}).`);
  }
  const value = (await response.json()) as AssetPackManifest;
  if (value.schema !== "asset-pack.web.v1" || !Array.isArray(value.assets)) {
    throw new Error("The asset manifest has an unsupported schema.");
  }
  return value;
}
