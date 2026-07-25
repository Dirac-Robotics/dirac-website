/**
 * Seed script. Run with:  npm run db:seed
 * (loads .env via --env-file). Idempotent: clears domain rows and re-inserts.
 *
 * Seeds 10 visible asset requests with realistic requester data (email +
 * organisation) and one downloaded reference image each, uploaded to Azure
 * Blob Storage so the leaderboard shows real thumbnails. Media seeding is
 * skipped gracefully if AZURE_STORAGE_* is not set. Uses its own postgres
 * client so it only needs DATABASE_URL (+ optional AZURE_STORAGE_*).
 */
import { Buffer } from "node:buffer";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, sql } from "drizzle-orm";
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";

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

// ── Azure Blob (optional): seed real reference images for the leaderboard. ──
const AZ_ACCOUNT = process.env.AZURE_STORAGE_ACCOUNT;
const AZ_KEY = process.env.AZURE_STORAGE_KEY;
const AZ_CONTAINER = process.env.AZURE_STORAGE_CONTAINER || "media";
const blobContainer =
  AZ_ACCOUNT && AZ_KEY
    ? new BlobServiceClient(
        `https://${AZ_ACCOUNT}.blob.core.windows.net`,
        new StorageSharedKeyCredential(AZ_ACCOUNT, AZ_KEY),
      ).getContainerClient(AZ_CONTAINER)
    : null;

// Wikimedia Commons requires a descriptive User-Agent.
const UA = "dirac-website-seed/1.0 (https://diracrobotics.com)";

/** Resolve a relevant Wikimedia Commons photo (JPEG/PNG) for a search query. */
async function findCommonsImage(
  query: string,
): Promise<{ url: string; mime: string } | null> {
  const api =
    "https://commons.wikimedia.org/w/api.php?action=query&generator=search" +
    `&gsrsearch=${encodeURIComponent(`${query} filetype:bitmap`)}` +
    "&gsrnamespace=6&gsrlimit=6&prop=imageinfo&iiprop=url|mime" +
    "&iiurlwidth=800&format=json";
  const res = await fetch(api, { headers: { "User-Agent": UA } });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    query?: {
      pages?: Record<
        string,
        { index?: number; imageinfo?: { thumburl?: string; mime?: string }[] }
      >;
    };
  };
  const pages = json.query?.pages;
  if (!pages) return null;
  const ordered = Object.values(pages).sort(
    (a, b) => (a.index ?? 0) - (b.index ?? 0),
  );
  for (const p of ordered) {
    const info = p.imageinfo?.[0];
    if (
      info?.thumburl &&
      (info.mime === "image/jpeg" || info.mime === "image/png")
    ) {
      return { url: info.thumburl, mime: info.mime };
    }
  }
  return null;
}

/** Find a relevant image, download it, and upload it to blob storage. */
async function seedImage(
  query: string,
  index: number,
): Promise<{
  storageKey: string;
  url: string;
  size: number;
  mime: string;
} | null> {
  if (!blobContainer) return null;
  try {
    const found = await findCommonsImage(query);
    if (!found) return null;
    const res = await fetch(found.url, { headers: { "User-Agent": UA } });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 1024) return null; // guard against tiny error pages
    const ext = found.mime === "image/png" ? "png" : "jpg";
    const storageKey = `requests/seed-${index}-${crypto.randomUUID()}.${ext}`;
    const blob = blobContainer.getBlockBlobClient(storageKey);
    await blob.uploadData(buf, {
      blobHTTPHeaders: { blobContentType: found.mime },
    });
    return { storageKey, url: blob.url, size: buf.length, mime: found.mime };
  } catch (err) {
    console.warn(`  image failed for "${query}": ${(err as Error).message}`);
    return null;
  }
}

// 10 real robot-manipulation objects, each with a requester and a Wikimedia
// Commons search query. All visible so the full set shows on the leaderboard.
type SeedRequest = {
  title: string;
  description: string;
  organization: string;
  requesterName: string;
  requesterEmail: string;
  imageQuery: string;
  status: schema.AssetRequest["status"];
};

const REQUESTS: SeedRequest[] = [
  {
    title: "Robotiq 2F-85 gripper",
    description:
      "Two-finger adaptive gripper. Need accurate joint dynamics and fingertip friction for grasp sim.",
    organization: "Carnegie Mellon University",
    requesterName: "Maya Chen",
    requesterEmail: "maya.chen@cmu.edu",
    imageQuery: "robotic gripper",
    status: "building",
  },
  {
    title: "Cordless power drill",
    description:
      "Handheld cordless drill. Trigger and mass distribution matter for pickup and handover tasks.",
    organization: "MIT CSAIL",
    requesterName: "Kenji Watanabe",
    requesterEmail: "kenji.watanabe@mit.edu",
    imageQuery: "cordless drill",
    status: "under_review",
  },
  {
    title: "Cereal box",
    description:
      "Rigid boxed food item. Need measured mass and surface friction for shelf picking.",
    organization: "UC Berkeley",
    requesterName: "Priya Nair",
    requesterEmail: "priya.nair@berkeley.edu",
    imageQuery: "cereal box",
    status: "accepted",
  },
  {
    title: "Electric kettle",
    description:
      "Plastic-and-steel kettle with a hinged lid. Handle grasp and pouring dynamics.",
    organization: "ETH Zurich",
    requesterName: "Diego Ferreira",
    requesterEmail: "diego.ferreira@ethz.ch",
    imageQuery: "electric kettle",
    status: "submitted",
  },
  {
    title: "Ceramic coffee mug",
    description:
      "Ceramic mug with a handle. Measured mass, tipping, and handle-grasp dynamics.",
    organization: "Stanford Robotics Lab",
    requesterName: "Aisha Khan",
    requesterEmail: "aisha.khan@stanford.edu",
    imageQuery: "coffee mug",
    status: "shipped",
  },
  {
    title: "Rubik's cube",
    description:
      "Standard 57mm cube. Per-face friction and mass for in-hand manipulation.",
    organization: "University of Toronto",
    requesterName: "Tom Blake",
    requesterEmail: "tom.blake@utoronto.ca",
    imageQuery: "rubik's cube",
    status: "submitted",
  },
  {
    title: "Kitchen blender",
    description:
      "Countertop blender with a removable jar. Two-part grasp and centre-of-mass shift.",
    organization: "TU Munich",
    requesterName: "Lena Hoffmann",
    requesterEmail: "lena.hoffmann@tum.de",
    imageQuery: "kitchen blender",
    status: "submitted",
  },
  {
    title: "Mechanical keyboard",
    description:
      "Compact mechanical keyboard. Thin profile and key travel for precise placement tasks.",
    organization: "Georgia Tech",
    requesterName: "Omar Said",
    requesterEmail: "omar.said@gatech.edu",
    imageQuery: "computer keyboard",
    status: "under_review",
  },
  {
    title: "Tennis ball",
    description:
      "Compliant felt-covered sphere. Restitution and rolling friction for dynamic grasps.",
    organization: "Imperial College London",
    requesterName: "Sofia Rossi",
    requesterEmail: "sofia.rossi@imperial.ac.uk",
    imageQuery: "tennis ball",
    status: "submitted",
  },
  {
    title: "Cast iron skillet",
    description:
      "Heavy cast iron pan with a long handle. High mass and offset centre of gravity.",
    organization: "University of Tokyo",
    requesterName: "Wei Zhang",
    requesterEmail: "wei.zhang@u-tokyo.ac.jp",
    imageQuery: "cast iron skillet",
    status: "submitted",
  },
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
    description:
      "Measured two-finger adaptive gripper with calibrated joint dynamics.",
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

  // Requesters + requests (all visible) with a reference image each.
  for (let i = 0; i < REQUESTS.length; i++) {
    const r = REQUESTS[i]!;
    const requesterId = await ensureUser(r.requesterEmail, r.requesterName);

    const [request] = await db
      .insert(assetRequests)
      .values({
        userId: requesterId,
        title: r.title,
        description: r.description,
        organization: r.organization,
        status: r.status,
        moderationState: "visible",
      })
      .returning({ id: assetRequests.id });

    // Reference image -> blob -> media row (drives the leaderboard thumbnail).
    const image = await seedImage(r.imageQuery, i + 1);
    if (image) {
      await db.insert(assetRequestMedia).values({
        requestId: request!.id,
        storageKey: image.storageKey,
        url: image.url,
        mimeType: image.mime,
        sizeBytes: image.size,
        kind: "image",
      });
    }
    console.log(`  ${r.title}${image ? " + image" : ""}`);

    // Cast a plausible set of votes. Mostly upvotes, a few downvotes.
    const voteCount = Math.max(2, Math.floor(Math.random() * voterIds.length));
    const shuffled = [...voterIds]
      .sort(() => Math.random() - 0.5)
      .slice(0, voteCount);
    for (const uid of shuffled) {
      const value = Math.random() < 0.85 ? 1 : -1;
      await db
        .insert(votes)
        .values({ requestId: request!.id, userId: uid, value });
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
  console.log(`  ${REQUESTS.length} asset requests with votes + images`);

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
