import type { Metadata } from "next";
import { socialMetadata } from "@/lib/config/site";
import { HeroHorizon } from "@/components/landing/hero-horizon";
import { HeroIntro } from "@/components/landing/hero-intro";
import { GridIllumination } from "@/components/marketing/grid-illumination";
import { WarehouseStory } from "@/components/workflow/warehouse-story";
import { AssetGallery } from "@/components/assets/asset-gallery";
import { SampleSubmissionSection } from "@/components/submissions/sample-submission-section";

const DESCRIPTION = "Accelerate your robot rollouts with site-specific simulations adapted to your teleoperation data.";
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  description: DESCRIPTION,
  ...socialMetadata({ title: "From simulation to deployment · Dirac Robotics", description: DESCRIPTION, path: "/" }),
};

export default function HomePage() {
  return (
    <main id="content" className="relative flex-1">
      <HeroIntro />
      <GridIllumination />
      <HeroHorizon />
      <WarehouseStory />
      <AssetGallery />
      <SampleSubmissionSection />
    </main>
  );
}
