"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { assetRequests, votes } from "@/lib/db/schema";
import { voteSchema, type VoteInput } from "@/lib/validation";
import { getCurrentUser } from "@/lib/session";
import { getClientIp } from "@/lib/request-context";
import { enforceRateLimits, RATE_LIMITS } from "@/lib/rate-limit";

export type UserVote = -1 | 0 | 1;

export type VoteResult =
  | { ok: true; score: number; userVote: UserVote }
  | { ok: false; error: string; needsAuth?: boolean };

/**
 * Cast, flip, or clear a vote.
 *   - no existing vote      -> insert (userVote = value)
 *   - existing, same value  -> delete (userVote = 0)   [clicking active clears]
 *   - existing, other value -> update (userVote = value) [flip]
 *
 * The votes table is the source of truth. `vote_score` is recomputed by summing
 * votes inside the SAME transaction, so the denormalized value can never drift.
 * A verified email (a real session) is required to vote.
 */
export async function castVote(input: VoteInput): Promise<VoteResult> {
  const parsed = voteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid vote." };

  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Sign in to vote.", needsAuth: true };
  }

  const ip = await getClientIp();
  const rl = await enforceRateLimits([
    { bucket: `vote:acct:${user.id}`, ...RATE_LIMITS.votePerAccount },
    { bucket: `vote:ip:${ip}`, ...RATE_LIMITS.votePerIp },
  ]);
  if (!rl.ok) {
    return { ok: false, error: "You are voting too fast. Slow down a moment." };
  }

  const { requestId, value } = parsed.data;

  try {
    const outcome = await db.transaction(async (tx) => {
      const [req] = await tx
        .select({
          id: assetRequests.id,
          moderationState: assetRequests.moderationState,
        })
        .from(assetRequests)
        .where(eq(assetRequests.id, requestId))
        .limit(1);

      if (!req || req.moderationState !== "visible") {
        return { notFound: true as const };
      }

      const [existing] = await tx
        .select({ id: votes.id, value: votes.value })
        .from(votes)
        .where(and(eq(votes.requestId, requestId), eq(votes.userId, user.id)))
        .limit(1);

      let userVote: UserVote;
      if (!existing) {
        await tx.insert(votes).values({ requestId, userId: user.id, value });
        userVote = value;
      } else if (existing.value === value) {
        await tx.delete(votes).where(eq(votes.id, existing.id));
        userVote = 0;
      } else {
        await tx
          .update(votes)
          .set({ value, updatedAt: new Date() })
          .where(eq(votes.id, existing.id));
        userVote = value;
      }

      const [row] = await tx
        .select({
          score: sql<number>`coalesce(sum(${votes.value}), 0)::int`,
        })
        .from(votes)
        .where(eq(votes.requestId, requestId));

      const score = row?.score ?? 0;
      await tx
        .update(assetRequests)
        .set({ voteScore: score })
        .where(eq(assetRequests.id, requestId));

      return { score, userVote };
    });

    if ("notFound" in outcome) {
      return { ok: false, error: "That request is not available." };
    }

    revalidatePath("/");
    return { ok: true, score: outcome.score, userVote: outcome.userVote };
  } catch {
    // e.g. a concurrent double-submit hitting the unique constraint.
    return { ok: false, error: "Could not record your vote. Try again." };
  }
}
