"use client";

import * as React from "react";

import { AssetDetail } from "@/components/asset-pack/asset-detail";
import { AssetPackGallery } from "@/components/asset-pack/asset-pack-gallery";
import { DownloadGate } from "@/components/asset-pack/download-gate";
import {
  configureAssetPackAnalytics,
  recordAssetPackEvent,
} from "@/lib/asset-pack/analytics";
import { fetchAssetPackManifest } from "@/lib/asset-pack/manifest";
import type {
  AssetPackManifest,
  AssetRecord,
} from "@/lib/asset-pack/types";

export function AssetPackRoute({
  manifestUrl,
}: {
  manifestUrl: string;
}) {
  const [manifest, setManifest] = React.useState<AssetPackManifest | null>(null);
  const [selected, setSelected] = React.useState<AssetRecord | null>(null);
  const [downloadAll, setDownloadAll] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let active = true;
    fetchAssetPackManifest(manifestUrl)
      .then((value) => {
        if (!active) return;
        configureAssetPackAnalytics(value.capabilities.serverAnalytics);
        setManifest(value);
        const slug = window.location.hash.replace(/^#/, "");
        setSelected(
          value.assets.find((asset) => asset.slug === slug) ?? null,
        );
      })
      .catch((reason: Error) => active && setError(reason.message));
    return () => {
      active = false;
      configureAssetPackAnalytics(false);
    };
  }, [manifestUrl]);

  React.useEffect(() => {
    if (!manifest) return;
    const onHashChange = () => {
      const slug = window.location.hash.replace(/^#/, "");
      setSelected(
        manifest.assets.find((asset) => asset.slug === slug) ?? null,
      );
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [manifest]);

  function select(asset: AssetRecord | null) {
    setSelected(asset);
    const next = asset ? `#${asset.slug}` : window.location.pathname;
    window.history.pushState({}, "", next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-3xl text-foreground">Asset pack unavailable</h1>
        <p className="prose-body mx-auto mt-4">{error}</p>
      </div>
    );
  }
  if (!manifest) {
    return (
      <div className="data mx-auto max-w-6xl px-6 py-24 text-center text-[0.65rem] uppercase text-dim">
        Loading asset records
      </div>
    );
  }

  return (
    <>
      {selected ? (
        <AssetDetail
          key={selected.slug}
          asset={selected}
          termsVersion={manifest.termsVersion}
          downloadsEnabled={manifest.capabilities.downloads}
          contactUrl={manifest.capabilities.contactUrl}
          onBack={() => select(null)}
        />
      ) : (
        <AssetPackGallery
          manifest={manifest}
          downloadsEnabled={manifest.capabilities.downloads}
          contactUrl={manifest.capabilities.contactUrl}
          onSelectAsset={(asset) => select(asset)}
          onDownloadAll={() => {
            setDownloadAll(true);
            recordAssetPackEvent("download_gate_open", {
              bundleId: "all-assets",
            });
          }}
        />
      )}
      {downloadAll && manifest.capabilities.downloads ? (
        <DownloadGate
          bundleId="all-assets"
          termsVersion={manifest.termsVersion}
          onClose={() => setDownloadAll(false)}
        />
      ) : null}
    </>
  );
}
