import { getLeaderboard } from "@/lib/queries";

// Read live scores on every request; never cache the snapshot.
export const dynamic = "force-dynamic";

const MAX_LIMIT = 50;

/**
 * Live leaderboard snapshot for client polling. Public and read-only: it only
 * returns what the server already renders on the home page, so there is no new
 * data exposure. `no-store` so intermediaries never serve a stale board.
 */
export async function GET(request: Request) {
  const raw = Number(new URL(request.url).searchParams.get("limit"));
  const limit = Number.isFinite(raw)
    ? Math.min(Math.max(1, Math.trunc(raw)), MAX_LIMIT)
    : 10;

  const rows = await getLeaderboard({ limit });
  return Response.json({ rows }, { headers: { "cache-control": "no-store" } });
}
