"use server";

import { and, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { assetRequests } from "@/lib/db/schema";
import { upvoteSchema, type UpvoteInput } from "@/lib/validation";
import { getClientIp } from "@/lib/http/request-context";
import { enforceRateLimits, RATE_LIMITS } from "@/lib/http/rate-limit";

export type UpvoteResult =
  | { ok: true; score: number; upvoted: boolean }
  | { ok: false; error: string };

/**
 * Anonymous, localStorage-backed upvoting.
 *
 * There is no account and no per-user vote row. The browser remembers whether
 * it has upvoted a request (a localStorage flag), and this action adjusts the
 * denormalized `vote_score` by +1 / -1 to match. For anonymous voting the
 * `vote_score` column is the source of truth. The `greatest(..., 0)` floor
 * keeps a stray "remove" (e.g. a browser whose flag drifted) from pushing a
 * score below zero.
 *
 * This is deliberately best-effort: someone can clear localStorage and upvote
 * again. IP rate limiting is the only abuse control, which is acceptable for a
 * community popularity signal (nothing financial rides on it).
 */
export async function toggleUpvote(input: UpvoteInput): Promise<UpvoteResult> {
  const parsed = upvoteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const ip = await getClientIp();
  const rl = await enforceRateLimits([
    { bucket: `vote:ip:${ip}`, ...RATE_LIMITS.votePerIp },
  ]);
  if (!rl.ok) {
    return { ok: false, error: "You are voting too fast. Slow down a moment." };
  }

  const { requestId, upvote } = parsed.data;
  const delta = upvote ? 1 : -1;

  try {
    const [row] = await db
      .update(assetRequests)
      .set({
        voteScore: sql`greatest(${assetRequests.voteScore} + ${delta}, 0)`,
      })
      .where(
        and(
          eq(assetRequests.id, requestId),
          eq(assetRequests.moderationState, "visible"),
        ),
      )
      .returning({ score: assetRequests.voteScore });

    if (!row) return { ok: false, error: "That request is not available." };
    return { ok: true, score: row.score, upvoted: upvote };
  } catch {
    return { ok: false, error: "Could not record your vote. Try again." };
  }
}
