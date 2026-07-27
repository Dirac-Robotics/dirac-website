/**
 * Seed script. Run with:  npm run db:seed
 * (loads .env via --env-file). Idempotent: clears domain rows and re-inserts.
 *
 * Seeds the visible asset requests with requester data (email + organisation)
 * and, where a licence-clean source exists, one Wikimedia Commons reference
 * image uploaded to Azure Blob Storage so the leaderboard shows a real
 * thumbnail. Media seeding is skipped gracefully if AZURE_STORAGE_* is not set,
 * in which case the leaderboard falls back to its monogram tile. Uses its own
 * postgres client so it only needs DATABASE_URL (+ optional AZURE_STORAGE_*).
 *
 * Image credits for the seeded photos live in `lib/config/image-credits.ts`.
 * Keep the two in sync: those photos are CC BY-SA, so the credits have to be
 * on screen before the images go live.
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

/** Thumbnail width for seeded reference images, matching what shipped before. */
const THUMB_WIDTH = 800;

/**
 * Resolve one exact Wikimedia Commons file by title.
 *
 * Deliberately not a keyword search: every seeded image is a specific file we
 * have checked the licence and author for, so the result has to be
 * reproducible. Commons does the downscale for us via `iiurlwidth`, which is
 * also how the previous seed sized its thumbnails.
 */
async function fetchCommonsFile(
  fileTitle: string,
): Promise<{ url: string; mime: string } | null> {
  const api =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json" +
    "&prop=imageinfo&iiprop=url|mime" +
    `&iiurlwidth=${THUMB_WIDTH}&titles=${encodeURIComponent(fileTitle)}`;
  const res = await fetch(api, { headers: { "User-Agent": UA } });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    query?: {
      pages?: Record<
        string,
        { imageinfo?: { thumburl?: string; url?: string; mime?: string }[] }
      >;
    };
  };
  const page = Object.values(json.query?.pages ?? {})[0];
  const info = page?.imageinfo?.[0];
  if (!info?.mime) return null;
  // Files narrower than THUMB_WIDTH have no thumburl; use the original rather
  // than upscaling.
  const url = info.thumburl ?? info.url;
  if (!url) return null;
  if (info.mime !== "image/jpeg" && info.mime !== "image/png") return null;
  return { url, mime: info.mime };
}

/** Download one Commons file and upload it to blob storage. */
async function seedImage(
  fileTitle: string,
  index: number,
): Promise<{
  storageKey: string;
  url: string;
  size: number;
  mime: string;
} | null> {
  if (!blobContainer) return null;
  try {
    const found = await fetchCommonsFile(fileTitle);
    if (!found) {
      console.warn(`  image not resolved: ${fileTitle}`);
      return null;
    }
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
    console.warn(`  image failed for "${fileTitle}": ${(err as Error).message}`);
    return null;
  }
}

/**
 * The seeded leaderboard.
 *
 * Scores are set deliberately low and close together so the board reads as
 * beatable: a handful of real votes should visibly reshuffle the top half.
 * Nothing goes above 10. Ties are broken by `createdAt` descending in the
 * leaderboard query, so `main` backdates each row to hold this exact order.
 *
 * `commonsFile` names one specific, licence-checked Wikimedia Commons file.
 * Entries with `commonsFile: null` have no licence-clean source yet and fall
 * back to the monogram tile the leaderboard already renders for missing
 * thumbnails. See the TODO list below for the ones awaiting studio photos.
 */
type SeedRequest = {
  title: string;
  description: string;
  organization: string;
  requesterName: string;
  requesterEmail: string;
  /** Exact Commons file title, or null to use the placeholder tile. */
  commonsFile: string | null;
  /** Net upvotes. Backed by real rows in `votes` so the two reconcile. */
  votes: number;
  status: schema.AssetRequest["status"];
};

// TODO: replace the placeholder tile with our own studio photo for each of
// these, which have no licence-clean source. Do not substitute stock, Etsy,
// eBay or press photography.
//   - Robot fighting championship belt
//   - Y Combinator water bottle
//   - One Wish Willow prop
//   - Swatch x AP pocket watch
//   - Warehouse tote
//   - Dinner plate
const REQUESTS: SeedRequest[] = [
  {
    title: "Gold football trophy",
    description:
      "Tall metal trophy on a plinth. Top-heavy, so the tipping point and the grasp on a narrow stem are the interesting parts.",
    organization: "Independent",
    requesterName: "Maya Chen",
    requesterEmail: "maya.chen@example.com",
    commonsFile:
      "File:FIFA_World_Cup_Trophy_(Jules_Rimet_Trophy)_at_National_Football_Museum,_Manchester_02.jpg",
    votes: 10,
    status: "submitted",
  },
  {
    title: "Robot fighting championship belt",
    description:
      "Wide leather belt with a heavy metal plate. Deformable strap plus a rigid centre, awkward to lift flat.",
    organization: "Independent",
    requesterName: "Kenji Watanabe",
    requesterEmail: "kenji.watanabe@example.com",
    commonsFile: null,
    votes: 8,
    status: "submitted",
  },
  {
    title: "Half marathon finisher medal",
    description:
      "Flat metal disc on a ribbon. Thin profile on a table is a hard pinch grasp, and the ribbon is fully compliant.",
    organization: "Independent",
    requesterName: "Priya Nair",
    requesterEmail: "priya.nair@example.com",
    commonsFile: "File:2015_Shanghai_half_marathon_medal.jpg",
    votes: 8,
    status: "submitted",
  },
  {
    title: "RoboCup ball",
    description:
      "Standard size football. Rolling resistance and restitution matter more than shape for kicking and trapping.",
    organization: "Independent",
    requesterName: "Diego Ferreira",
    requesterEmail: "diego.ferreira@example.com",
    commonsFile: "File:Soccerball.png",
    votes: 5,
    status: "submitted",
  },
  {
    title: "Y Combinator water bottle",
    description:
      "Insulated steel bottle with a screw cap. Cylindrical grasp, shifting mass when partly filled.",
    organization: "Independent",
    requesterName: "Aisha Khan",
    requesterEmail: "aisha.khan@example.com",
    commonsFile: null,
    votes: 5,
    status: "submitted",
  },
  {
    title: "IPO gong and mallet",
    description:
      "Suspended metal disc plus a padded mallet. Two objects, one task, and a struck contact worth getting right.",
    organization: "Independent",
    requesterName: "Tom Blake",
    requesterEmail: "tom.blake@example.com",
    commonsFile: "File:Gong_bali.jpg",
    votes: 3,
    status: "submitted",
  },
  {
    title: "One Wish Willow prop",
    description:
      "Slender branching prop with thin extremities. Self-collision and a fragile silhouette under a closing gripper.",
    organization: "Independent",
    requesterName: "Lena Hoffmann",
    requesterEmail: "lena.hoffmann@example.com",
    commonsFile: null,
    votes: 3,
    status: "submitted",
  },
  {
    title: "Swatch x AP pocket watch",
    description:
      "Small watch on a chain. Tiny rigid body attached to a flexible chain, which is a genuinely hard pairing to simulate.",
    organization: "Independent",
    requesterName: "Omar Said",
    requesterEmail: "omar.said@example.com",
    commonsFile: null,
    votes: 2,
    status: "submitted",
  },
  {
    title: "Warehouse tote",
    description:
      "Stackable plastic tote with moulded handles. Bread and butter for picking cells, and it nests when empty.",
    organization: "Independent",
    requesterName: "Sofia Rossi",
    requesterEmail: "sofia.rossi@example.com",
    commonsFile: null,
    votes: 2,
    status: "submitted",
  },
  {
    title: "Traffic cone",
    description:
      "Weighted rubber cone. Soft body on a heavy base, and it should right itself after a nudge.",
    organization: "Independent",
    requesterName: "Wei Zhang",
    requesterEmail: "wei.zhang@example.com",
    commonsFile: "File:Traffic_Cone.jpg",
    votes: 1,
    status: "submitted",
  },
  {
    title: "Dinner plate",
    description:
      "Glazed ceramic plate. Low friction, thin rim, and a flat lift off a table that most policies still fumble.",
    organization: "Independent",
    requesterName: "Noor Haddad",
    requesterEmail: "noor.haddad@example.com",
    commonsFile: null,
    votes: 1,
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
      "Two-finger adaptive gripper with predicted, calibrated joint dynamics.",
    physics: {
      mass: { value: 0.925, uncertainty: 0.01, unit: "kg" },
      friction: { value: 0.71, uncertainty: 0.04, unit: "μ" },
      inertia: { value: 0.0021, uncertainty: 0.0002, unit: "kg·m²" },
    },
  },
  {
    name: "YCB cracker box",
    slug: "ycb-cracker-box",
    description: "Rigid boxed item with predicted surface friction.",
    physics: {
      mass: { value: 0.411, uncertainty: 0.005, unit: "kg" },
      friction: { value: 0.42, uncertainty: 0.03, unit: "μ" },
      inertia: { value: 0.0009, uncertainty: 0.0001, unit: "kg·m²" },
    },
  },
  {
    name: "Kitchen mug",
    slug: "kitchen-mug",
    description: "Ceramic mug with handle. Predicted mass and tipping dynamics.",
    physics: {
      mass: { value: 0.34, uncertainty: 0.008, unit: "kg" },
      friction: { value: 0.55, uncertainty: 0.05, unit: "μ" },
      inertia: { value: 0.00045, uncertainty: 0.00005, unit: "kg·m²" },
    },
  },
  {
    name: "Hardwood block",
    slug: "hardwood-block",
    description: "Single maple block, predicted density and contact friction.",
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

  // The leaderboard sorts by score, then `createdAt` descending. Backdating
  // each row one minute further into the past keeps REQUESTS order intact
  // where scores tie, instead of leaving it to insertion timing.
  const now = Date.now();

  const maxVotes = Math.max(...REQUESTS.map((r) => r.votes));
  if (maxVotes > voterIds.length) {
    throw new Error(
      `Need ${maxVotes} voters to back the highest score, have ${voterIds.length}.`,
    );
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
        createdAt: new Date(now - i * 60_000),
      })
      .returning({ id: assetRequests.id });

    // Reference image -> blob -> media row (drives the leaderboard thumbnail).
    const image = r.commonsFile ? await seedImage(r.commonsFile, i + 1) : null;
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

    // Exactly `r.votes` upvotes from distinct voters, so the votes table and
    // the denormalized score agree. One vote per user is a DB constraint.
    for (const uid of voterIds.slice(0, r.votes)) {
      await db.insert(votes).values({
        requestId: request!.id,
        userId: uid,
        value: 1,
      });
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

    const imageNote = image
      ? " + image"
      : !r.commonsFile
        ? " (placeholder tile, no licence-clean source yet)"
        : blobContainer
          ? " (image FAILED)"
          : " (image skipped, AZURE_STORAGE_* not set)";
    console.log(`  ${String(score).padStart(2)}  ${r.title}${imageNote}`);
  }
  console.log(`  ${REQUESTS.length} asset requests with votes + images`);

  // Catalog assets (published, with predicted physics, no media on fresh DB).
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
