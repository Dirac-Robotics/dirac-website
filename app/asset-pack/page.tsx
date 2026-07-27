import type { Metadata } from "next";

import { AssetPackRoute } from "@/components/asset-pack/asset-pack-route";

export const metadata: Metadata = {
  title: "Simulation Asset Pack",
  description:
    "Simulation-ready chair, table, and hammer assets with disclosed physical assumptions and validation evidence.",
  alternates: { canonical: "/asset-pack" },
  robots: { index: false, follow: false },
};

export default function AssetPackPage() {
  return (
    <main id="content" className="relative flex-1 bg-background">
      <AssetPackRoute manifestUrl="/asset-pack/manifest.json" />
    </main>
  );
}
