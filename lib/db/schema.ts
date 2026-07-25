/**
 * Database schema (Drizzle ORM, Postgres).
 *
 * Layers:
 *   1. Auth.js adapter tables (users, accounts, sessions, verification_tokens)
 *   2. Domain tables (asset_requests, asset_request_media, votes, leads, assets, asset_media)
 *   3. Ops tables (rate_limit_events)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PHASE 2 SEAM — PAYMENTS & ENTITLEMENTS (do not build now)
 * ─────────────────────────────────────────────────────────────────────────────
 * Selling asset packs, purchase history, and gated Evals access are deferred.
 * They are designed to slot in WITHOUT migrating any table below, because the
 * only join keys future tables need are the stable UUID primary keys on
 * `users.id` and `assets.id`. When payments land, add NEW tables only:
 *
 *   products      (id, asset_id -> assets.id, price_cents, currency, stripe_price_id, ...)
 *   orders        (id, user_id -> users.id, status, stripe_checkout_id, total_cents, ...)
 *   order_items   (id, order_id -> orders.id, product_id -> products.id, ...)
 *   entitlements  (id, user_id -> users.id, asset_id -> assets.id, source, granted_at, expires_at)
 *   download_grants(id, entitlement_id -> entitlements.id, storage_key, expires_at, ...)
 *
 * The download route and `lib/entitlements` module already gate on an
 * entitlement check that currently returns "catalog is public"; swapping that
 * for a real `entitlements` lookup is the only wiring needed. No ALTER on the
 * tables in this file. See lib/entitlements/index.ts.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// ── Enums ────────────────────────────────────────────────────────────────────

export const userRole = pgEnum("user_role", ["user", "admin"]);

export const requestStatus = pgEnum("request_status", [
  "submitted",
  "under_review",
  "accepted",
  "building",
  "shipped",
  "rejected",
]);

/**
 * Moderation is orthogonal to workflow `status`.
 *   visible  → shown on the public leaderboard
 *   flagged  → marked as spam by an admin, hidden from public, kept for audit
 *   hidden   → manually removed from public without a spam judgement
 * The public leaderboard shows `visible` only. Nothing is ever deleted.
 */
export const moderationState = pgEnum("moderation_state", [
  "visible",
  "flagged",
  "hidden",
]);

export const mediaKind = pgEnum("media_kind", ["image", "video"]);

// Asset (catalog) media supports a future 3D viewer via the `model` kind.
export const assetMediaKind = pgEnum("asset_media_kind", [
  "image",
  "video",
  "model",
]);

export const leadInterest = pgEnum("lead_interest", [
  "real2sim",
  "evals",
  "assets",
  "other",
]);

// ── 1. Auth.js adapter tables ────────────────────────────────────────────────
// Column *property names* below must match what @auth/drizzle-adapter expects.
// Our extra columns (role, createdAt) have DB defaults so adapter inserts work.

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("email_verified", { mode: "date", withTimezone: true }),
  image: text("image"),
  // Domain fields:
  role: userRole("role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("users_email_unique").on(t.email)]);

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date", withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date", withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// ── 2. Domain tables ─────────────────────────────────────────────────────────

export const assetRequests = pgTable(
  "asset_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    organization: text("organization"),
    status: requestStatus("status").notNull().default("submitted"),
    moderationState: moderationState("moderation_state").notNull().default("visible"),
    // Denormalized for sort. Source of truth is the votes table; this is
    // recomputed from votes inside the same transaction on every vote.
    voteScore: integer("vote_score").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Leaderboard sort: visible rows, highest net score, newest as tiebreak.
    index("asset_requests_leaderboard_idx").on(
      t.moderationState,
      t.voteScore.desc(),
      t.createdAt.desc(),
    ),
    index("asset_requests_user_idx").on(t.userId),
    index("asset_requests_status_idx").on(t.status),
  ],
);

export const assetRequestMedia = pgTable(
  "asset_request_media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => assetRequests.id, { onDelete: "cascade" }),
    storageKey: text("storage_key").notNull(),
    url: text("url"),
    mimeType: text("mime_type").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    kind: mediaKind("kind").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("asset_request_media_request_idx").on(t.requestId)],
);

export const votes = pgTable(
  "votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => assetRequests.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    value: integer("value").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Vote uniqueness enforced at the DB level, not just in app code.
    uniqueIndex("votes_request_user_unique").on(t.requestId, t.userId),
    // Vote lookups by user (audit + "did I already vote?").
    index("votes_user_idx").on(t.userId),
    index("votes_request_idx").on(t.requestId),
    check("votes_value_check", sql`${t.value} IN (-1, 1)`),
  ],
);

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    company: text("company"),
    interest: leadInterest("interest").notNull(),
    message: text("message"),
    sourcePage: text("source_page"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("leads_created_idx").on(t.createdAt.desc()),
    index("leads_interest_idx").on(t.interest),
  ],
);

/**
 * Physics metadata is the whole pitch: measured, with stated uncertainty.
 * Shape (see lib/types.ts `AssetPhysics`):
 *   { mass, friction, inertia, ...each { value, uncertainty, unit } }
 * Stored as JSONB so the shape can evolve without a migration.
 */
export const assets = pgTable(
  "assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    physics: jsonb("physics").notNull().default(sql`'{}'::jsonb`),
    published: boolean("published").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("assets_slug_unique").on(t.slug),
    index("assets_published_idx").on(t.published),
  ],
);

export const assetMedia = pgTable(
  "asset_media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    storageKey: text("storage_key").notNull(),
    url: text("url"),
    mimeType: text("mime_type").notNull(),
    kind: assetMediaKind("kind").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("asset_media_asset_idx").on(t.assetId)],
);

// ── 3. Ops tables ────────────────────────────────────────────────────────────

/**
 * Fixed-window rate limiting, Postgres-backed so it works on serverless
 * (in-memory counters do not survive between Vercel invocations).
 * One row per action; `checkRateLimit` counts recent rows in a bucket.
 * SEAM: swap lib/rate-limit.ts for Upstash Redis later without schema change.
 */
export const rateLimitEvents = pgTable(
  "rate_limit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bucket: text("bucket").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("rate_limit_bucket_created_idx").on(t.bucket, t.createdAt)],
);

// ── Inferred types ───────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type AssetRequest = typeof assetRequests.$inferSelect;
export type NewAssetRequest = typeof assetRequests.$inferInsert;
export type AssetRequestMedia = typeof assetRequestMedia.$inferSelect;
export type Vote = typeof votes.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type Asset = typeof assets.$inferSelect;
export type AssetMedia = typeof assetMedia.$inferSelect;
