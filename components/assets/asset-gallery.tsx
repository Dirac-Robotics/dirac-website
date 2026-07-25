import type { GalleryAsset } from "@/lib/queries";
import type { PhysicsQuantity } from "@/lib/types";

function fmt(q?: PhysicsQuantity): string | null {
  if (!q) return null;
  const unit = q.unit ? ` ${q.unit}` : "";
  return `${q.value} ± ${q.uncertainty}${unit}`;
}

/** Measured physics is the pitch, so it is shown up front, not on hover. */
function PhysicsLine({ asset }: { asset: GalleryAsset }) {
  const parts: { label: string; value: string }[] = [];
  const mass = fmt(asset.physics.mass);
  const friction = fmt(asset.physics.friction);
  const inertia = fmt(asset.physics.inertia);
  if (mass) parts.push({ label: "mass", value: mass });
  // Not "μ": the labels are uppercased, and μ uppercases to a capital Mu.
  if (friction) parts.push({ label: "friction", value: friction });
  if (inertia) parts.push({ label: "inertia", value: inertia });
  if (parts.length === 0) return null;

  return (
    <dl className="data flex flex-wrap gap-x-4 gap-y-1 text-[0.65rem]">
      {parts.map((p) => (
        <div key={p.label} className="flex gap-1.5">
          <dt className="uppercase text-dim">{p.label}</dt>
          <dd className="text-ash">{p.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function AssetTile({ asset }: { asset: GalleryAsset }) {
  return (
    <article className="card-flat flex h-full flex-col overflow-hidden rounded-md transition-colors">
      {/*
        ── PHASE 2 SEAM: 3D VIEWER ──────────────────────────────────────────
        This media block is a static image today. Swapping it for an
        interactive 3D viewer (e.g. a <model-viewer> or React Three Fiber
        canvas fed by an `asset_media` row of kind 'model') is a contained
        change: keep this <div class="aspect-...">, replace its contents. The
        tile layout, physics line, and grid do not change.
        ────────────────────────────────────────────────────────────────────
      */}
      <div className="aspect-[4/3] w-full overflow-hidden border-b border-border bg-muted">
        {asset.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={asset.imageUrl}
            alt={asset.name}
            className="size-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            aria-hidden="true"
            className="data flex size-full items-center justify-center text-xs text-dim"
          >
            {asset.name}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3 p-4">
        <h3 className="text-lg leading-tight text-foreground">
          {asset.name}
        </h3>
        <PhysicsLine asset={asset} />
      </div>
    </article>
  );
}

export function AssetGallery({ assets }: { assets: GalleryAsset[] }) {
  if (assets.length === 0) return null;
  return (
    <section
      id="gallery"
      className="relative z-10 border-b border-border bg-background"
    >
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="mb-10 text-center">
          <div className="eyebrow mb-4">Shipped assets</div>
          <h2 className="text-3xl leading-[1.1] text-foreground md:text-4xl">
            Built and measured.
          </h2>
          <p className="prose-body mx-auto mt-4">
            Every physical value on these assets was measured against real
            hardware, with stated uncertainty.
          </p>
        </div>
        {/*
          Centred flex-wrap rather than a grid: with a count that is not a
          multiple of the column number, a grid orphans the trailing tile
          against an empty half-row, which reads as a bug. This centres it.
        */}
        <div className="flex flex-wrap justify-center gap-5">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="w-full sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)]"
            >
              <AssetTile asset={asset} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
