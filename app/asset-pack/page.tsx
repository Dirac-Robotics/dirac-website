import type { Metadata } from "next";

import { AssetPackRoute } from "@/components/asset-pack/asset-pack-route";
import { socialMetadata } from "@/lib/config/site";

const DESCRIPTION =
  "Simulation-ready chair, table, and hammer assets with disclosed physical assumptions and validation evidence.";

export const metadata: Metadata = {
  title: "Simulation Asset Pack",
  description: DESCRIPTION,
  alternates: { canonical: "/asset-pack" },
  robots: { index: true, follow: true },
  ...socialMetadata({
    title: "Simulation Asset Pack · Dirac Robotics",
    description: DESCRIPTION,
    path: "/asset-pack",
  }),
};

export const revalidate = 0;

export default function AssetPackPage() {
  return (
    <main id="content" className="relative flex-1 bg-background">
      <AssetPackRoute manifestUrl="/asset-pack/manifest.json?v=0.1.0-beta.3" />
    </main>
  );
}
