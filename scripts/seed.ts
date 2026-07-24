/**
 * Seed script. Run with:  npm run db:seed
 * (loads .env via --env-file). Idempotent: clears domain rows and re-inserts.
 *
 * Uses its own postgres client so it only needs DATABASE_URL, not the full
 * server env. Media is intentionally not seeded (there are no real storage
 * objects on a fresh DB); tiles and rows fall back to name placeholders.
 */
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, sql } from "drizzle-orm";

import * as schema from "../lib/db/schema";

const {
  users,
  assets,
  assetRequests,
  votes,
  leads,
  assetRequestMedia,
  assetMedia,
} = schema;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set. Run: npm run db:seed (with .env).");
  process.exit(1);
}

const ADMIN_EMAIL = (
  process.env.ADMIN_NOTIFY_EMAIL || "admin@diracrobotics.com"
).toLowerCase();

const client = postgres(DATABASE_URL, { prepare: false });
const db = drizzle(client, { schema });

// Real robot-manipulation objects.
const REQUESTS: { title: string; description: string; status: schema.AssetRequest["status"] }[] = [
  { title: "Robotiq 2F-85 gripper", description: "Two-finger adaptive gripper. Need accurate joint dynamics and fingertip friction for grasp sim.", status: "building" },
  { title: "YCB power drill", description: "The classic YCB cordless drill. Trigger and mass distribution matter for pickup tasks.", status: "under_review" },
  { title: "YCB cracker box", description: "Rigid boxed food item. Need measured mass and surface friction.", status: "accepted" },
  { title: "YCB mustard bottle", description: "Deformable-cap bottle, common manipulation benchmark object.", status: "submitted" },
  { title: "Franka Emika Panda link set", description: "Per-link inertia for the 7-DOF arm. Current URDFs are inconsistent.", status: "shipped" },
  { title: "Kitchen mug with handle", description: "Ceramic mug. Handle grasp and tipping dynamics.", status: "submitted" },
  { title: "Rubik's cube", description: "Standard 57mm cube. Face friction and per-face mass.", status: "submitted" },
  { title: "Wooden block set (KUKA innsbruck)", description: "Assorted hardwood blocks for stacking. Density varies by block.", status: "under_review" },
  { title: "Hex key (Allen) set", description: "Thin metal tools, tricky contact geometry for pick and insert.", status: "submitted" },
  { title: "Tennis ball", description: "Compliant sphere. Restitution and rolling friction.", status: "rejected" },
];

const CATALOG: {
  name: string;
  slug: string;
  description: string;
  physics: Record<string, { value: number; uncertainty: number; unit: string }>;
}[] = [
  {
    name: "Robotiq 2F-85 gripper",
    slug: "robotiq-2f-85",
    description: "Measured two-finger adaptive gripper with calibrated joint dynamics.",
    physics: {
      mass: { value: 0.925, uncertainty: 0.01, unit: "kg" },
      friction: { value: 0.71, uncertainty: 0.04, unit: "μ" },
      inertia: { value: 0.0021, uncertainty: 0.0002, unit: "kg·m²" },
    },
  },
  {
    name: "YCB cracker box",
    slug: "ycb-cracker-box",
    description: "Rigid boxed item with measured surface friction.",
    physics: {
      mass: { value: 0.411, uncertainty: 0.005, unit: "kg" },
      friction: { value: 0.42, uncertainty: 0.03, unit: "μ" },
      inertia: { value: 0.0009, uncertainty: 0.0001, unit: "kg·m²" },
    },
  },
  {
    name: "Kitchen mug",
    slug: "kitchen-mug",
    description: "Ceramic mug with handle. Measured mass and tipping dynamics.",
    physics: {
      mass: { value: 0.34, uncertainty: 0.008, unit: "kg" },
      friction: { value: 0.55, uncertainty: 0.05, unit: "μ" },
      inertia: { value: 0.00045, uncertainty: 0.00005, unit: "kg·m²" },
    },
  },
  {
    name: "Hardwood block",
    slug: "hardwood-block",
    description: "Single maple block, measured density and contact friction.",
    physics: {
      mass: { value: 0.128, uncertainty: 0.003, unit: "kg" },
      friction: { value: 0.48, uncertainty: 0.04, unit: "μ" },
      inertia: { value: 0.00012, uncertainty: 0.00002, unit: "kg·m²" },
    },
  },
];

async function ensureUser(
  email: string,
  name: string,
  role: "user" | "admin" = "user",
): Promise<string> {
  const e = email.toLowerCase();
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, e))
    .limit(1);
  if (existing[0]) {
    await db
      .update(users)
      .set({ name, role, emailVerified: new Date() })
      .where(eq(users.id, existing[0].id));
    return existing[0].id;
  }
  const [row] = await db
    .insert(users)
    .values({ email: e, name, role, emailVerified: new Date() })
    .returning({ id: users.id });
  return row!.id;
}

async function main() {
  console.log("Seeding...");

  // Clear domain data (idempotent). Order respects FKs / cascades.
  await db.delete(votes);
  await db.delete(assetRequestMedia);
  await db.delete(assetRequests);
  await db.delete(assetMedia);
  await db.delete(assets);
  await db.delete(leads);

  // Admin + a pool of verified voters.
  const adminId = await ensureUser(ADMIN_EMAIL, "Dirac Admin", "admin");
  console.log(`  admin: ${ADMIN_EMAIL}`);

  const voterIds: string[] = [adminId];
  for (let i = 1; i <= 12; i++) {
    const id = await ensureUser(`voter${i}@example.com`, `Voter ${i}`);
    voterIds.push(id);
  }

  // Requesters + requests.
  const requesterNames = [
    "Maya", "Kenji", "Priya", "Diego", "Aisha", "Tom",
    "Lena", "Omar", "Sofia", "Wei",
  ];
  let flaggedOnce = false;
  let hiddenOnce = false;

  for (let i = 0; i < REQUESTS.length; i++) {
    const r = REQUESTS[i]!;
    const requesterEmail = `requester${i + 1}@example.com`;
    const requesterId = await ensureUser(requesterEmail, requesterNames[i] ?? `User ${i}`);

    // One flagged and one hidden example for admin/moderation legibility.
    let moderationState: schema.AssetRequest["moderationState"] = "visible";
    if (!flaggedOnce && r.status === "rejected") {
      moderationState = "flagged";
      flaggedOnce = true;
    } else if (!hiddenOnce && i === REQUESTS.length - 2) {
      moderationState = "hidden";
      hiddenOnce = true;
    }

    const [request] = await db
      .insert(assetRequests)
      .values({
        userId: requesterId,
        title: r.title,
        description: r.description,
        status: r.status,
        moderationState,
      })
      .returning({ id: assetRequests.id });

    // Cast a plausible set of votes. Mostly upvotes, a few downvotes.
    const voteCount = Math.max(1, Math.floor(Math.random() * voterIds.length));
    const shuffled = [...voterIds].sort(() => Math.random() - 0.5).slice(0, voteCount);
    for (const uid of shuffled) {
      const value = Math.random() < 0.82 ? 1 : -1;
      await db.insert(votes).values({ requestId: request!.id, userId: uid, value });
    }

    // Recompute denormalized score from the source of truth.
    const [{ score }] = await db
      .select({ score: sql<number>`coalesce(sum(${votes.value}), 0)::int` })
      .from(votes)
      .where(eq(votes.requestId, request!.id));
    await db
      .update(assetRequests)
      .set({ voteScore: score })
      .where(eq(assetRequests.id, request!.id));
  }
  console.log(`  ${REQUESTS.length} asset requests with votes`);

  // Catalog assets (published, with measured physics, no media on fresh DB).
  for (const c of CATALOG) {
    await db.insert(assets).values({
      name: c.name,
      slug: c.slug,
      description: c.description,
      physics: c.physics,
      published: true,
    });
  }
  console.log(`  ${CATALOG.length} catalog assets`);

  // A couple of sample leads.
  await db.insert(leads).values([
    {
      name: "Jordan Lee",
      email: "jordan@robotcorp.example",
      company: "RobotCorp",
      interest: "real2sim",
      message: "Interested in a Real2Sim pipeline for our warehouse cell.",
      sourcePage: "/real2sim",
    },
    {
      name: "Sam Rivera",
      email: "sam@evalslab.example",
      company: "Evals Lab",
      interest: "evals",
      message: "Would like early access to the Evals platform.",
      sourcePage: "/evals",
    },
  ]);
  console.log("  2 leads");

  console.log("Seed complete.");
  await client.end();
}

main().catch(async (err) => {
  console.error(err);
  await client.end();
  process.exit(1);
});
