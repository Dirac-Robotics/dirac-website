/**
 * Postgres-backed fixed-window rate limiting. Works on serverless where
 * in-memory counters do not survive between invocations.
 *
 * SEAM: this is intentionally a thin, swappable module. To move to Upstash
 * Redis later, reimplement `checkRateLimit` with the same signature; no caller
 * changes. There is a small read-then-insert race under high concurrency that
 * is acceptable for spam mitigation (not for anything financial).
 */
import { and, gte, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { rateLimitEvents } from "@/lib/db/schema";

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
};

/** Named limits, tuned for a public voting campaign. */
export const RATE_LIMITS = {
  submitPerIp: { limit: 5, windowMs: 60 * 60 * 1000 },
  submitPerEmail: { limit: 3, windowMs: 60 * 60 * 1000 },
  votePerAccount: { limit: 80, windowMs: 60 * 60 * 1000 },
  votePerIp: { limit: 120, windowMs: 60 * 60 * 1000 },
  leadPerIp: { limit: 6, windowMs: 60 * 60 * 1000 },
  leadPerEmail: { limit: 3, windowMs: 24 * 60 * 60 * 1000 },
  presignPerIp: { limit: 40, windowMs: 60 * 60 * 1000 },
} as const;

export async function checkRateLimit(
  bucket: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const since = new Date(Date.now() - windowMs);

  const rows = await db
    .select({
      count: sql<number>`count(*)::int`,
      oldest: sql<Date | null>`min(${rateLimitEvents.createdAt})`,
    })
    .from(rateLimitEvents)
    .where(
      and(
        sql`${rateLimitEvents.bucket} = ${bucket}`,
        gte(rateLimitEvents.createdAt, since),
      ),
    );

  const count = rows[0]?.count ?? 0;
  if (count >= limit) {
    const oldestMs = rows[0]?.oldest
      ? new Date(rows[0].oldest).getTime()
      : Date.now();
    return {
      ok: false,
      remaining: 0,
      retryAfterMs: Math.max(0, oldestMs + windowMs - Date.now()),
    };
  }

  await db.insert(rateLimitEvents).values({ bucket });
  return { ok: true, remaining: limit - count - 1, retryAfterMs: 0 };
}

/**
 * Enforce several buckets at once. Returns the first failure, or ok.
 * Note: only records a hit in every bucket when ALL pass, to avoid one tripped
 * limit consuming budget in the others.
 */
export async function enforceRateLimits(
  checks: { bucket: string; limit: number; windowMs: number }[],
): Promise<RateLimitResult> {
  // Peek first (count only) so a failure in a later bucket doesn't record hits.
  for (const c of checks) {
    const since = new Date(Date.now() - c.windowMs);
    const rows = await db
      .select({
        count: sql<number>`count(*)::int`,
        oldest: sql<Date | null>`min(${rateLimitEvents.createdAt})`,
      })
      .from(rateLimitEvents)
      .where(
        and(
          sql`${rateLimitEvents.bucket} = ${c.bucket}`,
          gte(rateLimitEvents.createdAt, since),
        ),
      );
    const count = rows[0]?.count ?? 0;
    if (count >= c.limit) {
      const oldestMs = rows[0]?.oldest
        ? new Date(rows[0].oldest).getTime()
        : Date.now();
      return {
        ok: false,
        remaining: 0,
        retryAfterMs: Math.max(0, oldestMs + c.windowMs - Date.now()),
      };
    }
  }
  // All clear: record a hit in each bucket.
  await db
    .insert(rateLimitEvents)
    .values(checks.map((c) => ({ bucket: c.bucket })));
  return { ok: true, remaining: 0, retryAfterMs: 0 };
}
