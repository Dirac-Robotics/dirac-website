import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";

import { getLeaderboard, getLeaderboardCount } from "@/lib/data/queries";
import { socialMetadata } from "@/lib/config/site";
import { Button } from "@/components/ui/button";
import { ChallengeStrip } from "@/components/assets/challenge-strip";
import { HeroShowcase } from "@/components/assets/hero-showcase";
import { Leaderboard } from "@/components/assets/leaderboard";
import { LeaderboardStrip } from "@/components/assets/leaderboard-strip";
import { LeaderboardVideo } from "@/components/assets/leaderboard-video";
import { SubmitAssetModal } from "@/components/assets/submit-asset-modal";
import { AssetGallery } from "@/components/assets/asset-gallery";

const DESCRIPTION =
  "Request a physics-accurate object for Isaac Sim, vote on what the community wants next, and help decide which assets Dirac builds.";

export const metadata: Metadata = {
  title: "Community Asset Program",
  alternates: { canonical: "/community-assets" },
  description: DESCRIPTION,
  ...socialMetadata({
    title: "Community Asset Program · Dirac Robotics",
    description: DESCRIPTION,
    path: "/community-assets",
  }),
};

// The leaderboard and vote totals must always reflect live database state.
export const dynamic = "force-dynamic";

const LEADERBOARD_LIMIT = 10;

export default async function CommunityAssetsPage() {
  const [rows, totalCount] = await Promise.all([
    getLeaderboard({ limit: LEADERBOARD_LIMIT }),
    getLeaderboardCount(),
  ]);

  return (
    <main id="content" className="relative flex-1">
      <section
        id="top"
        className="relative isolate flex min-h-[92vh] flex-col overflow-hidden border-b border-border bg-(--void)"
      >
        <div className="flex flex-1 flex-col items-center px-6 pt-10 pb-5 text-center">
          <div className="eyebrow mb-4">Community asset program</div>
          <h1 className="max-w-3xl text-[2.5rem] leading-[1.03] tracking-[-0.03em] text-foreground sm:text-6xl lg:text-[4rem]">
            The assets you vote for, built for you.
          </h1>
          <p className="prose-lead mx-auto mt-4">
            Request a photoreal, physics-accurate object for Isaac Sim, rally
            the community to upvote it, and the leaderboard decides what we
            build next.
          </p>

          <HeroShowcase className="mt-2 min-h-80 w-full flex-1" />

          <p className="prose-body mx-auto mt-4">
            The top 20 get built. The top 5 ship free to everyone.
          </p>

          <div className="mt-4">
            <SubmitAssetModal
              trigger={
                <Button
                  size="lg"
                  className="h-14 gap-2 px-10 text-base font-semibold"
                >
                  Submit an asset
                  <ArrowRight className="size-4" />
                </Button>
              }
            />
          </div>
        </div>

        <LeaderboardStrip rows={rows} />
      </section>

      <section
        id="leaderboard"
        className="relative isolate overflow-hidden scroll-mt-24 border-b border-border"
      >
        <LeaderboardVideo />
        <div
          className="absolute inset-0 -z-10 bg-background/90"
          aria-hidden="true"
        />
        <div className="mx-auto w-full max-w-3xl px-6 py-16 md:py-20">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="eyebrow mb-2">Leaderboard</div>
              <h2 className="text-2xl leading-tight text-foreground sm:text-3xl">
                What the community wants built next
              </h2>
            </div>
            <LiveIndicator />
          </div>
          <Leaderboard
            rows={rows}
            totalCount={totalCount}
            shownCount={rows.length}
            realtime
            pollLimit={LEADERBOARD_LIMIT}
          />
          <div className="mt-10">
            <ChallengeStrip />
          </div>
        </div>
      </section>

      <AssetGallery />
    </main>
  );
}

function LiveIndicator() {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-foreground/50" />
        <span className="relative inline-flex size-1.5 rounded-full bg-foreground" />
      </span>
      <span className="data text-[0.6rem] tracking-[0.12em] text-dim uppercase">
        Live
      </span>
    </span>
  );
}
