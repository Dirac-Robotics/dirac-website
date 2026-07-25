import "server-only";
import { asc, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  assetRequests,
  assetRequestMedia,
  leads,
  users,
  votes,
} from "@/lib/db/schema";
import { getReadUrl } from "@/lib/storage";

export type AdminRequestRow = {
  id: string;
  title: string;
  status: string;
  moderationState: string;
  voteScore: number;
  createdAt: Date;
  requesterName: string | null;
  requesterEmail: string;
  mediaCount: number;
  thumbnailUrl: string | null;
};

export async function getAdminRequests(): Promise<AdminRequestRow[]> {
  const rows = await db
    .select({
      id: assetRequests.id,
      title: assetRequests.title,
      status: assetRequests.status,
      moderationState: assetRequests.moderationState,
      voteScore: assetRequests.voteScore,
      createdAt: assetRequests.createdAt,
      requesterName: users.name,
      requesterEmail: users.email,
    })
    .from(assetRequests)
    .innerJoin(users, eq(users.id, assetRequests.userId))
    .orderBy(desc(assetRequests.createdAt));

  const ids = rows.map((r) => r.id);
  const countByRequest = new Map<string, number>();
  const thumbKeyByRequest = new Map<string, string>();

  if (ids.length > 0) {
    const media = await db
      .select({
        requestId: assetRequestMedia.requestId,
        storageKey: assetRequestMedia.storageKey,
        kind: assetRequestMedia.kind,
      })
      .from(assetRequestMedia)
      .where(inArray(assetRequestMedia.requestId, ids))
      .orderBy(asc(assetRequestMedia.createdAt));
    for (const m of media) {
      countByRequest.set(m.requestId, (countByRequest.get(m.requestId) ?? 0) + 1);
      if (m.kind === "image" && !thumbKeyByRequest.has(m.requestId)) {
        thumbKeyByRequest.set(m.requestId, m.storageKey);
      }
    }
  }

  const signed = await Promise.all(
    rows.map((r) => {
      const key = thumbKeyByRequest.get(r.id);
      return key ? getReadUrl(key) : Promise.resolve(null);
    }),
  );

  return rows.map((r, i) => ({
    ...r,
    mediaCount: countByRequest.get(r.id) ?? 0,
    thumbnailUrl: signed[i] ?? null,
  }));
}

export async function getAdminLeads() {
  return db.select().from(leads).orderBy(desc(leads.createdAt));
}

export type VoteAuditRow = {
  requestTitle: string;
  voterEmail: string;
  value: number;
  votedAt: Date;
  accountAgeDays: number;
};

/** Recent vote log for auditing a suspicious run. Newest first. */
export async function getVoteAudit(limit = 200): Promise<VoteAuditRow[]> {
  const rows = await db
    .select({
      requestTitle: assetRequests.title,
      voterEmail: users.email,
      value: votes.value,
      votedAt: votes.createdAt,
      accountCreated: users.createdAt,
      ageDays: sql<number>`floor(extract(epoch from (now() - ${users.createdAt})) / 86400)::int`,
    })
    .from(votes)
    .innerJoin(users, eq(users.id, votes.userId))
    .innerJoin(assetRequests, eq(assetRequests.id, votes.requestId))
    .orderBy(desc(votes.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    requestTitle: r.requestTitle,
    voterEmail: r.voterEmail,
    value: r.value,
    votedAt: r.votedAt,
    accountAgeDays: r.ageDays,
  }));
}
