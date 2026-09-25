import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { ButtonLabel } from "@/components/ui/button-label";

const ASSETS = [
  { slug: "purple-chair", title: "Purple chair", image: "purple-chair-light.webp", detail: "Seat response / 01" },
  { slug: "table", title: "Glass side table", image: "table-light.webp", detail: "Contact & friction / 02" },
  { slug: "hammer", title: "Claw hammer", image: "hammer-light.webp", detail: "Mass & inertia / 03" },
];

/** Lightweight previews lead into the preserved on-demand interactive viewer. */
export function AssetGallery() {
  return (
    <section id="assets" className="technical-grid border-b border-border bg-secondary/45 py-20 md:py-28">
      <div className="site-container">
        <div className="eyebrow section-index">Simulation assets</div>
        <div className="mt-6 flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
          <h2 className="section-heading max-w-[18ch]">Simulation-ready assets.</h2>
          <div className="max-w-84"><p className="text-sm leading-7 text-body">Inspect the geometry. Explore the physics.</p><Link href="/asset-pack" className="site-button site-button-dark mt-6"><ButtonLabel>Explore assets</ButtonLabel><ArrowRight aria-hidden="true" /></Link></div>
        </div>
        <div className="mt-12 grid gap-px border border-border bg-border sm:grid-cols-3">
          {ASSETS.map((asset) => <Link key={asset.slug} href={`/asset-pack#${asset.slug}`} className="group min-w-0 bg-background">
            <div className="relative aspect-[4/3] overflow-hidden bg-secondary"><Image src={`/asset-pack/posters/${asset.image}`} alt={`${asset.title} simulation preview`} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.025] motion-reduce:transform-none" /><span className="absolute right-4 bottom-4 flex size-9 items-center justify-center border border-border bg-background/95"><ArrowUpRight className="size-4" aria-hidden="true" /></span></div>
            <div className="border-t border-border p-6"><span className="data text-[9px] uppercase text-dim">{asset.detail}</span><h3 className="mt-2 text-xl">{asset.title}</h3></div>
          </Link>)}
        </div>
      </div>
    </section>
  );
}
