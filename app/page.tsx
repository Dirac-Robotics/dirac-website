import {
  getLeaderboard,
  getLeaderboardCount,
  getPublishedAssets,
} from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { ChallengeStrip } from "@/components/assets/challenge-strip";
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
      {/* Section A: hero + leaderboard */}
      <section id="top" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 pt-16 pb-16 md:pt-24 md:pb-24">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <div>
              <div className="eyebrow mb-6">Community asset program</div>
              <h1 className="font-serif text-[2.75rem] leading-[1.03] tracking-[-0.03em] text-balance text-foreground sm:text-6xl lg:text-[4.25rem]">
                For the community, by the community.
              </h1>
              <p className="mt-7 max-w-[52ch] text-sm leading-relaxed tracking-[0.02em] text-muted-foreground md:text-base">
                We are releasing our first Isaac Sim asset pack, and we are
                building it with the robotics community. Request any asset.
                Describe it in text, upload a photo, upload a video, or any
                combination. Every request goes on a public leaderboard where the
                community votes. The most upvoted asset gets built, and the person
                who requested it gets it free.
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

            <div>
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
