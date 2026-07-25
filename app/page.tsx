import { getLeaderboard, getLeaderboardCount } from "@/lib/queries";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChallengeStrip } from "@/components/assets/challenge-strip";
import { HeroShowcase } from "@/components/assets/hero-showcase";
import { Leaderboard } from "@/components/assets/leaderboard";
import { LeaderboardStrip } from "@/components/assets/leaderboard-strip";
import { LeaderboardVideo } from "@/components/assets/leaderboard-video";
import { SubmitAssetModal } from "@/components/assets/submit-asset-modal";
import { AssetGallery } from "@/components/assets/asset-gallery";
import { Positioning } from "@/components/assets/positioning";
import { Team } from "@/components/assets/team";

// Reads live vote scores on every request.
export const dynamic = "force-dynamic";

const LEADERBOARD_LIMIT = 10;

export default async function Home() {
  const [rows, totalCount] = await Promise.all([
    getLeaderboard({ limit: LEADERBOARD_LIMIT }),
    getLeaderboardCount(),
  ]);

  return (
    <main id="content" className="relative flex-1">
      {/* Section A: centered 3D showcase hero. */}
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
            the community to upvote it, and the top pick each cycle gets built
            and shipped free.
          </p>

          {/* Interactive 3D object carousel. Flexes to fill the hero height. */}
          <HeroShowcase className="mt-2 min-h-80 w-full flex-1" />

          <div className="mt-2">
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

        {/* Live leaderboard ticker, teasing the full board below. */}
        <LeaderboardStrip rows={rows} />
      </section>

      {/* Section B: the leaderboard, kept as the primary focus. */}
      <section
        id="leaderboard"
        className="relative isolate overflow-hidden scroll-mt-24 border-b border-border"
      >
        {/* Looping, darkened ambient video so the board does not read as empty. */}
        <LeaderboardVideo />
        <div
          className="absolute inset-0 -z-10 bg-linear-to-b from-background/90 via-background/75 to-background/95"
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

      {/* Section C: shipped asset gallery */}
      <AssetGallery />

      {/* Section D: positioning */}
      <Positioning />

      {/* Section E: team */}
      <Team />
    </main>
  );
}

/** Subtle "updating live" cue for the realtime leaderboard. Monochrome. */
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
