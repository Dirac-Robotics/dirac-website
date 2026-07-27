/**
 * The three shipped asset-pack objects, as shown on the home page.
 *
 * Single source of truth for the hero carousel and the gallery grid so the two
 * cannot drift. Values mirror `public/asset-pack/manifest.json`; `href` deep
 * links into the asset pack, which selects an asset from the URL hash.
 */

export type ShowcaseAsset = {
  /** Manifest slug. Also the asset-pack hash target. */
  slug: string;
  /** Short label for the hero carousel. */
  name: string;
  /** Full title, used on the gallery card. */
  title: string;
  /** Optimized preview GLB, shared with the asset-pack viewer. */
  url: string;
  href: string;
  /** Fine size nudge applied after fit-to-unit normalization. */
  fit?: number;
  specs: { label: string; value: string }[];
};

export const SHOWCASE_ASSETS: ShowcaseAsset[] = [
  {
    slug: "purple-chair",
    name: "Purple chair",
    title: "Purple chair",
    url: "/asset-pack/models/purple-chair-preview.glb",
    href: "/asset-pack#purple-chair",
    specs: [
      { label: "Mass", value: "14.0 kg estimate" },
      { label: "Bounds", value: "0.69 × 0.69 × 0.86 m" },
      { label: "Seat stiffness", value: "2.2 kN/m" },
      { label: "PCA fit", value: "< 1 mm RMSE" },
    ],
  },
  {
    slug: "table",
    name: "Glass side table",
    title: "Glass side table",
    url: "/asset-pack/models/table-preview.glb",
    href: "/asset-pack#table",
    specs: [
      { label: "Mass", value: "14.0 kg estimate" },
      { label: "Bounds", value: "0.86 × 0.86 × 0.45 m" },
      // Label is uppercased in CSS, which turns a Greek mu into a Latin-looking
      // M, so the symbol lives in the value instead.
      { label: "Floor friction", value: "0.62 μ" },
      { label: "Max penetration", value: "0.299 mm" },
    ],
  },
  {
    slug: "hammer",
    name: "Claw hammer",
    title: "Claw hammer",
    url: "/asset-pack/models/hammer-preview.glb",
    href: "/asset-pack#hammer",
    // Fit-to-unit normalizes on the longest dimension, so this long thin object
    // spans much wider than the chair or table. Pull it in to clear the flanks.
    fit: 0.82,
    specs: [
      { label: "Mass", value: "0.654 kg" },
      { label: "Length", value: "0.33 m" },
      { label: "Center of mass", value: "0.239 m from butt" },
      { label: "Pendulum error", value: "< 2%" },
    ],
  },
];
