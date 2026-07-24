import "server-only";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  assetRequests,
  assetRequestMedia,
  assetMedia,
  assets,
  users,
  votes,
} from "@/lib/db/schema";
import { getSignedReadUrl } from "@/lib/storage";
import type { AssetPhysics } from "@/lib/types";
import type { UserVote } from "@/app/actions/votes";

export type LeaderboardRow = {
  id: string;
  rank: number;
  title: string;
  status: string;
  voteScore: number;
  requesterFirstName: string;
  thumbnailUrl: string | null;
  userVote: UserVote;
};

function firstName(name: string | null): string {
  const n = name?.trim().split(/\s+/)[0];
  return n && n.length > 0 ? n : "Anonymous";
}

export async function getLeaderboardCount(): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(assetRequests)
    .where(eq(assetRequests.moderationState, "visible"));
  return row?.count ?? 0;
}

export async function getLeaderboard(opts: {
  currentUserId?: string | null;
  limit?: number;
  offset?: number;
}): Promise<LeaderboardRow[]> {
  const limit = opts.limit ?? 10;
  const offset = opts.offset ?? 0;

  const rows = await db
    .select({
      id: assetRequests.id,
      title: assetRequests.title,
      status: assetRequests.status,
      voteScore: assetRequests.voteScore,
      createdAt: assetRequests.createdAt,
      requesterName: users.name,
    })
    .from(assetRequests)
    .innerJoin(users, eq(users.id, assetRequests.userId))
    .where(eq(assetRequests.moderationState, "visible"))
    .orderBy(desc(assetRequests.voteScore), desc(assetRequests.createdAt))
    .limit(limit)
    .offset(offset);

  const ids = rows.map((r) => r.id);
  if (ids.length === 0) return [];

  // First image per request for the thumbnail.
  const media = await db
    .select({
      requestId: assetRequestMedia.requestId,
      storageKey: assetRequestMedia.storageKey,
      kind: assetRequestMedia.kind,
    })
    .from(assetRequestMedia)
    .where(inArray(assetRequestMedia.requestId, ids))
    .orderBy(asc(assetRequestMedia.createdAt));

  const thumbKeyByRequest = new Map<string, string>();
  for (const m of media) {
    if (m.kind === "image" && !thumbKeyByRequest.has(m.requestId)) {
      thumbKeyByRequest.set(m.requestId, m.storageKey);
    }
  }

  // Current user's votes on these requests.
  const voteByRequest = new Map<string, number>();
  if (opts.currentUserId) {
    const userVotes = await db
      .select({ requestId: votes.requestId, value: votes.value })
      .from(votes)
      .where(
        and(
          eq(votes.userId, opts.currentUserId),
          inArray(votes.requestId, ids),
        ),
      );
    for (const v of userVotes) voteByRequest.set(v.requestId, v.value);
  }

  // Sign thumbnails in parallel.
  const signed = await Promise.all(
    rows.map((r) => {
      const key = thumbKeyByRequest.get(r.id);
      return key ? getSignedReadUrl(key) : Promise.resolve(null);
    }),
  );

  return rows.map((r, i) => ({
    id: r.id,
    rank: offset + i + 1,
    title: r.title,
    status: r.status,
    voteScore: r.voteScore,
    requesterFirstName: firstName(r.requesterName),
    thumbnailUrl: signed[i] ?? null,
    userVote: (voteByRequest.get(r.id) ?? 0) as UserVote,
  }));
}

export type GalleryAsset = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  physics: AssetPhysics;
  imageUrl: string | null;
};

export async function getPublishedAssets(): Promise<GalleryAsset[]> {
  const rows = await db
    .select()
    .from(assets)
    .where(eq(assets.published, true))
    .orderBy(desc(assets.createdAt));

  const ids = rows.map((r) => r.id);
  const imageKeyByAsset = new Map<string, string>();
  if (ids.length > 0) {
    const media = await db
      .select({
        assetId: assetMedia.assetId,
        storageKey: assetMedia.storageKey,
        kind: assetMedia.kind,
        sortOrder: assetMedia.sortOrder,
      })
      .from(assetMedia)
      .where(inArray(assetMedia.assetId, ids))
      .orderBy(asc(assetMedia.sortOrder));
    for (const m of media) {
      if (m.kind === "image" && !imageKeyByAsset.has(m.assetId)) {
        imageKeyByAsset.set(m.assetId, m.storageKey);
      }
    }
  }

  const signed = await Promise.all(
    rows.map((r) => {
      const key = imageKeyByAsset.get(r.id);
      return key ? getSignedReadUrl(key) : Promise.resolve(null);
    }),
  );

  return rows.map((r, i) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description,
    physics: (r.physics ?? {}) as AssetPhysics,
    imageUrl: signed[i] ?? null,
  }));
}
