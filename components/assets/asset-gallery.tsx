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
  if (friction) parts.push({ label: "μ", value: friction });
  if (inertia) parts.push({ label: "inertia", value: inertia });
  if (parts.length === 0) return null;

  return (
    <dl className="mono flex flex-wrap gap-x-4 gap-y-1 text-[0.65rem] text-muted-foreground">
      {parts.map((p) => (
        <div key={p.label} className="flex gap-1.5">
          <dt className="uppercase tracking-[0.12em] text-[var(--graphite)]">
            {p.label}
          </dt>
          <dd className="text-ash tabular-nums">{p.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function AssetTile({ asset }: { asset: GalleryAsset }) {
  return (
    <article className="card-flat flex flex-col overflow-hidden rounded-md transition-colors">
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
            className="mono flex size-full items-center justify-center text-xs text-[var(--graphite)]"
          >
            {asset.name}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3 p-4">
        <h3 className="font-serif text-lg leading-tight text-foreground">
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
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="eyebrow mb-4">Shipped assets</div>
        <h2 className="mb-10 max-w-[36ch] font-serif text-3xl leading-[1.1] tracking-[-0.02em] text-foreground md:text-4xl">
          Built and measured. Every value is real.
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <AssetTile key={asset.id} asset={asset} />
          ))}
        </div>
      </div>
    </section>
  );
}
