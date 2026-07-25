import {
  getLeaderboard,
  getLeaderboardCount,
  getPublishedAssets,
} from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { ChallengeStrip } from "@/components/assets/challenge-strip";
import { HeroVideo } from "@/components/assets/hero-video";
import { Leaderboard } from "@/components/assets/leaderboard";
import { SubmitAssetModal } from "@/components/assets/submit-asset-modal";
import { AssetGallery } from "@/components/assets/asset-gallery";
import { Positioning } from "@/components/assets/positioning";
import { Team } from "@/components/assets/team";

// Reads live vote scores and the signed-in user's votes on every request.
export const dynamic = "force-dynamic";

const LEADERBOARD_LIMIT = 10;

export default async function Home() {
  const user = await getCurrentUser();
  const [rows, totalCount, assets] = await Promise.all([
    getLeaderboard({ currentUserId: user?.id, limit: LEADERBOARD_LIMIT }),
    getLeaderboardCount(),
    getPublishedAssets(),
  ]);

  return (
    <main id="content" className="relative flex-1">
      {/* Section A: hero + leaderboard. `isolate` scopes the video's -z-10. */}
      <section
        id="top"
        className="relative isolate overflow-hidden border-b border-border"
      >
        <HeroVideo />
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          {/*
            min-w-0 on both columns: the leaderboard's truncated (nowrap) row
            titles otherwise force a min-content wider than a phone viewport.
          */}
          <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <div className="min-w-0">
              <div className="eyebrow mb-6">Community asset program</div>
              <h1 className="text-[2.75rem] leading-[1.03] tracking-[-0.03em] text-foreground sm:text-6xl lg:text-[4.25rem]">
                For the community, by the community.
              </h1>
              <p className="prose-lead mt-7">
                Our first Isaac Sim asset pack is built by request. Ask for what
                you need, the community votes, and the top request gets built.
                Whoever asked for it gets it free.
              </p>

              <div className="mt-8">
                <ChallengeStrip />
              </div>

              <div className="mt-8">
                <SubmitAssetModal
                  trigger={<Button size="lg">Submit Asset</Button>}
                />
              </div>
            </div>

            <div className="min-w-0">
              <div className="eyebrow mb-4">Leaderboard</div>
              <Leaderboard
                rows={rows}
                isAuthed={!!user}
                totalCount={totalCount}
                shownCount={rows.length}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section B: shipped asset gallery */}
      <AssetGallery assets={assets} />

      {/* Section C: positioning */}
      <Positioning />

      {/* Section D: team */}
      <Team />
    </main>
  );
}
