/**
 * Part 1 media migration: copy leaderboard reference images that currently live
 * in Supabase Storage into Azure Blob Storage, then repoint each
 * `asset_request_media` row (`storage_key` + `url`) at the Azure copy.
 *
 * NON-DESTRUCTIVE: the Supabase objects are LEFT IN PLACE. Deleting them is a
 * separate cleanup pass (Part 2) once we have confirmed the blob copies serve.
 *
 * Idempotent: rows that already point at Azure are skipped, and re-uploading
 * the same key just overwrites the identical bytes.
 *
 *   Dry run (default):  npx tsx --env-file=.env scripts/migrate-media-to-blob.ts
 *   Apply:              npx tsx --env-file=.env scripts/migrate-media-to-blob.ts --apply
 */
import { Buffer } from "node:buffer";
import postgres from "postgres";
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";

const APPLY = process.argv.includes("--apply");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set. Run with: --env-file=.env");
  process.exit(1);
}

const AZ_ACCOUNT = process.env.AZURE_STORAGE_ACCOUNT;
const AZ_KEY = process.env.AZURE_STORAGE_KEY;
const AZ_CONTAINER = process.env.AZURE_STORAGE_CONTAINER || "media";
if (!AZ_ACCOUNT || !AZ_KEY) {
  console.error("AZURE_STORAGE_ACCOUNT / AZURE_STORAGE_KEY are not set.");
  process.exit(1);
}

const container = new BlobServiceClient(
  `https://${AZ_ACCOUNT}.blob.core.windows.net`,
  new StorageSharedKeyCredential(AZ_ACCOUNT, AZ_KEY),
).getContainerClient(AZ_CONTAINER);
const AZURE_HOST = `${AZ_ACCOUNT}.blob.core.windows.net`;

// Session pooler (5432) is capped at 15 and shared with the live app; use the
// transaction pooler (6543) with a single short-lived connection.
const dbUrl = DATABASE_URL.replace(
  /(pooler\.supabase\.com|supabase\.com):5432/,
  "$1:6543",
);
const sql = postgres(dbUrl, { prepare: false, max: 1, idle_timeout: 5 });

/** requests/x.jpg from .../object/public/<bucket>/requests/x.jpg */
function blobKeyFromSupabaseUrl(u: string): string | null {
  const m = u.match(/\/object\/public\/[^/]+\/(.+)$/);
  return m ? decodeURIComponent(m[1]!) : null;
}

async function main() {
  const rows = await sql<
    { id: string; storage_key: string; url: string | null; mime_type: string }[]
  >`
    select id, storage_key, url, mime_type
    from asset_request_media
    order by created_at
  `;
  console.log(`${rows.length} media rows. mode=${APPLY ? "APPLY" : "DRY RUN"}\n`);

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const r of rows) {
    const src = r.url || r.storage_key;

    if (src.includes(AZURE_HOST) || !src.includes(".supabase.co/storage/")) {
      console.log(`skip (not Supabase): ${r.storage_key.slice(0, 70)}`);
      skipped++;
      continue;
    }

    const key = blobKeyFromSupabaseUrl(src);
    if (!key) {
      console.warn(`FAIL cannot derive blob key from ${src}`);
      failed++;
      continue;
    }

    try {
      const res = await fetch(src);
      if (!res.ok) {
        console.warn(`FAIL download ${res.status} ${src}`);
        failed++;
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 512) {
        console.warn(`FAIL tiny body (${buf.length}B) ${src}`);
        failed++;
        continue;
      }
      const mime =
        r.mime_type || res.headers.get("content-type") || "image/jpeg";
      const blob = container.getBlockBlobClient(key);
      const azureUrl = blob.url;

      if (!APPLY) {
        console.log(`DRY  ${buf.length}B  ${key}  ->  ${azureUrl}`);
        migrated++;
        continue;
      }

      await blob.uploadData(buf, {
        blobHTTPHeaders: { blobContentType: mime },
      });
      await sql`
        update asset_request_media
        set storage_key = ${key}, url = ${azureUrl}
        where id = ${r.id}
      `;
      console.log(`OK   ${buf.length}B  ${key}`);
      migrated++;
    } catch (err) {
      console.warn(`FAIL ${src}: ${(err as Error).message}`);
      failed++;
    }
  }

  console.log(
    `\nDone. ${APPLY ? "migrated" : "would migrate"}=${migrated} skipped=${skipped} failed=${failed}`,
  );
  if (!APPLY && migrated > 0) {
    console.log("Re-run with --apply to perform the migration.");
  }
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
