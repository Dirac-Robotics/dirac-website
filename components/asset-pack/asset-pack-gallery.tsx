import { ArrowLeft, ArrowUpRight, Box, Download } from "lucide-react";
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
      <div className="technical-grid border-b border-border">
        <div className="site-container pt-8"><Link href="/" className="inline-flex items-center gap-2 text-xs text-body hover:text-foreground"><ArrowLeft className="size-3.5" aria-hidden="true" />Back to Dirac</Link></div>
        <div className="site-container flex flex-col items-start gap-6 py-10 md:flex-row md:items-end md:justify-between md:py-14">
          <div>
            <h1
              id="asset-pack-title"
              className="section-heading text-foreground"
            >
              Simulation assets.
            </h1>
            <p className="mt-4 text-base text-body">Explore in 3D.</p>
          </div>
          {downloadsEnabled ? (
            <Button
              size="lg"
              className="h-12 shrink-0 px-5"
              onClick={onDownloadAll}
            >
              <Download className="size-4" />
              Download all
            </Button>
          ) : (
            <Button asChild size="lg" className="h-12 shrink-0 px-5">
              <a href={contactUrl} target="_blank" rel="noopener noreferrer">
                Request access
                <ArrowUpRight className="size-4" />
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="site-container py-12 md:py-16">
        <h2 className="data mb-6 text-[10px] uppercase text-dim">{manifest.assets.length} assets</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {manifest.assets.map((asset, index) => (
            <article
              className="overflow-hidden border border-border bg-card transition-colors hover:border-graphite"
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
                  <span className="data absolute top-4 left-4 border border-border bg-background/95 px-2 py-1 text-[0.62rem] text-body">
                    0{index + 1}
                  </span>
                  <span className="absolute top-4 right-4 flex size-9 items-center justify-center border border-border bg-background/95 text-foreground transition-colors group-hover:bg-secondary">
                    <ArrowUpRight className="size-4" />
                  </span>
                </div>
                <div className="p-5">
                  <h2 className="text-2xl leading-tight text-foreground">
                    {asset.title}
                  </h2>
                  <div className="data mt-4 flex flex-wrap justify-between gap-3 border-t border-border pt-4 text-[0.62rem] uppercase text-dim">
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
          {downloadsEnabled ? "For evaluation." : "Evaluation access by request."}
        </p>
      </div>
    </section>
  );
}
