import { ArrowUpRight, Box, Download, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type {
  AssetPackManifest,
  AssetRecord,
} from "@/lib/asset-pack/types";

export function AssetPackGallery({
  manifest,
  downloadsEnabled,
  contactUrl,
  onSelectAsset,
  onDownloadAll,
}: {
  manifest: AssetPackManifest;
  downloadsEnabled: boolean;
  contactUrl: string;
  onSelectAsset: (asset: AssetRecord) => void;
  onDownloadAll: () => void;
}) {
  return (
    <section aria-labelledby="asset-pack-title">
      <div className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[minmax(0,1fr)_20rem] md:items-end md:py-24">
          <div>
            <div className="eyebrow mb-5">
              {manifest.version} · evaluation beta
            </div>
            <h1
              id="asset-pack-title"
              className="max-w-4xl text-[2.7rem] leading-[1.02] tracking-[-0.035em] text-foreground sm:text-6xl lg:text-[4.8rem]"
            >
              Three objects. Full simulation records.
            </h1>
            <p className="prose-standfirst mt-6">{manifest.headline}</p>
            {downloadsEnabled ? (
              <Button
                size="lg"
                className="mt-8 h-12 px-5"
                onClick={onDownloadAll}
              >
                <Download className="size-4" />
                Unlock all assets
              </Button>
            ) : (
              <Button asChild size="lg" className="mt-8 h-12 px-5">
                <Link href={contactUrl}>
                  Request asset access
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
            )}
          </div>
          <div className="flex gap-3 border border-border bg-card p-4">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-ash" />
            <p className="text-sm leading-6 text-body">
              Every displayed physical value is labeled as measured, fitted,
              prior-driven, or unvalidated.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="grid gap-5 md:grid-cols-3">
          {manifest.assets.map((asset, index) => (
            <article
              className="overflow-hidden border border-border bg-card"
              key={asset.slug}
            >
              <button
                className="group block w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50"
                onClick={() => onSelectAsset(asset)}
                aria-label={`Open ${asset.title}`}
              >
                <div className="relative aspect-[4/3] overflow-hidden border-b border-border bg-(--void)">
                  {/* Posters load before visitors opt into any GLB. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset.posterUrl}
                    alt={`${asset.title} rendered preview`}
                    className="h-full w-full object-cover transition-transform duration-500 motion-reduce:transition-none group-hover:scale-[1.02]"
                  />
                  <span className="data absolute top-4 left-4 bg-black/75 px-2 py-1 text-[0.62rem] text-white/75">
                    0{index + 1}
                  </span>
                  <span className="absolute top-4 right-4 flex size-9 items-center justify-center border border-white/20 bg-black/75 text-white transition-colors group-hover:border-white/50">
                    <ArrowUpRight className="size-4" />
                  </span>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-2xl leading-tight text-foreground">
                      {asset.title}
                    </h2>
                    <span className="data border border-border px-2 py-1 text-[0.58rem] uppercase text-dim">
                      {asset.evidenceTier.replaceAll("-", " ")}
                    </span>
                  </div>
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-body">
                    {asset.description}
                  </p>
                  <div className="data mt-6 flex flex-wrap justify-between gap-3 border-t border-border pt-4 text-[0.62rem] uppercase text-dim">
                    <span className="inline-flex items-center gap-2">
                      <Box className="size-3.5" />
                      {asset.dimensions}
                    </span>
                    <span>{asset.mass}</span>
                  </div>
                </div>
              </button>
            </article>
          ))}
        </div>
        <p className="mt-6 text-right text-xs leading-5 text-dim">
          Evaluation-only showcase. Download bundles are available by request.
        </p>
      </div>
    </section>
  );
}
