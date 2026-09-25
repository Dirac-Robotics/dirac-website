import "server-only";
import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import { sampleRequests, sampleAttachments, rateLimitEvents } from "@/lib/db/schema";
import { getSampleConfig, getSampleLimits } from "./config";
import { SampleError } from "./errors";
import { privateSampleStorage } from "./storage";
import { adminSampleSchema, sampleContentType, submissionSchema, type UploadTicket } from "./validation";

async function database() {
  if (!getSampleConfig()) throw new SampleError(503, "Sample uploads are unavailable. Please book a call or email founders@diracrobotics.com.");
  return (await import("@/lib/db")).db;
}
type Database = Awaited<ReturnType<typeof database>>;
type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
async function lock(tx: Transaction, key: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`samples:${key}`}))`);
}
async function rateLimit(tx: Transaction, bucket: string, limit: number, windowHours = 1) {
  await lock(tx, bucket);
  const since = new Date(Date.now() - windowHours * 3600000);
  const [row] = await tx.select({ count: sql<number>`count(*)::int` }).from(rateLimitEvents)
    .where(and(eq(rateLimitEvents.bucket, bucket), gte(rateLimitEvents.createdAt, since)));
  if (row.count >= limit) throw new SampleError(429, "Too many requests. Please try again later or book a call.");
  await tx.insert(rateLimitEvents).values({ bucket });
}
async function requestWithFiles(tx: Transaction, id: string) {
  const [request] = await tx.select().from(sampleRequests).where(eq(sampleRequests.id, id));
  if (!request) throw new SampleError(404, "Request not found.");
  const files = await tx.select().from(sampleAttachments).where(eq(sampleAttachments.requestId, id)).orderBy(asc(sampleAttachments.relativePath));
  return { request, files };
}
function checkToken(request: typeof sampleRequests.$inferSelect, token: string) {
  const stored = request.uploadTokenHash;
  if (!stored || token.length < 40 || !timingSafeEqual(Buffer.from(hash(token)), Buffer.from(stored)) ||
      !request.uploadExpiresAt || request.uploadExpiresAt.getTime() < Date.now() || request.uploadState === "delete_failed") {
    throw new SampleError(403, "This upload link is invalid or expired. Please start a new request.");
  }
}

async function admitUploadAttempt(db: Database, id: string, token: string, operation: "resume" | "complete") {
  // Commit admission separately from the storage/finalization transaction.
  // Otherwise any failed upload rolls its own rate-limit event back. Check
  // the capability first so strangers cannot exhaust a visitor's allowance.
  return db.transaction(async (tx) => {
    await lock(tx, id);
    const { request } = await requestWithFiles(tx, id);
    checkToken(request, token);
    if (request.uploadState === "complete") return true;
    await rateLimit(tx, `sample:${operation}:${id}`, 30);
    return false;
  });
}

export async function createSample(input: unknown, clientIp: string): Promise<UploadTicket> {
  const parsed = submissionSchema(getSampleLimits()).safeParse(input);
  if (!parsed.success) throw new SampleError(400, parsed.error.issues[0]?.message ?? "Invalid request.");
  const storage = await privateSampleStorage();
  const db = await database();
  const id = randomUUID();
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 48 * 3600000);
  const { files, name, email, company, category, description } = parsed.data;
  const contact = { name, email, company, category, description };
  const attachments = files.map((file) => {
    const fileId = randomUUID();
    return { ...file, id: fileId, requestId: id, contentType: sampleContentType(file.originalFilename)!,
      stagingKey: `samples/${id}/staging/${fileId}`, storageKey: `samples/${id}/committed/${fileId}` };
  });
  await db.transaction(async (tx) => {
    // All writers take the global bucket first, making admission atomic across
    // app instances and avoiding lock order inversion across per-person keys.
    await rateLimit(tx, "sample:create:global", 200, 24);
    await rateLimit(tx, `sample:create:ip:${hash(clientIp)}`, 5);
    await rateLimit(tx, `sample:create:email:${hash(contact.email)}`, 3);
    await tx.insert(sampleRequests).values({ ...contact, id, uploadTokenHash: hash(token), uploadExpiresAt: expiresAt, writeSasExpiresAt: new Date(Date.now() + 21 * 60000) });
    await tx.insert(sampleAttachments).values(attachments);
  });
  return { id, token, expiresAt: expiresAt.toISOString(), files: attachments.map((file) => ({ id: file.id, relativePath: file.relativePath, sizeBytes: file.sizeBytes, uploaded: false, url: storage.uploadUrl(file.stagingKey) })) };
}

export async function resumeSample(id: string, token: string) {
  const db = await database();
  if (await admitUploadAttempt(db, id, token, "resume")) return { complete: true, files: [] };
  const storage = await privateSampleStorage();
  return db.transaction(async (tx) => {
    await lock(tx, id);
    const { request, files } = await requestWithFiles(tx, id);
    checkToken(request, token);
    if (request.uploadState === "complete") return { complete: true, files: [] };
    await tx.update(sampleRequests).set({ writeSasExpiresAt: new Date(Date.now() + 21 * 60000) }).where(eq(sampleRequests.id, id));
    const tickets = await Promise.all(files.map(async (file) => {
      const uploaded = !!file.uploadedAt || await storage.validBlob(file.stagingKey, file);
      return { id: file.id, relativePath: file.relativePath, sizeBytes: file.sizeBytes, uploaded, ...(uploaded ? {} : { url: storage.uploadUrl(file.stagingKey) }) };
    }));
    return { complete: false, files: tickets };
  });
}

export async function completeSample(id: string, token: string) {
  const db = await database();
  if (await admitUploadAttempt(db, id, token, "complete")) return { complete: true, id };
  const storage = await privateSampleStorage();
  return db.transaction(async (tx) => {
    await lock(tx, id);
    const { request, files } = await requestWithFiles(tx, id);
    checkToken(request, token);
    if (request.uploadState === "complete") return { complete: true, id };
    for (const file of files) {
      await storage.finalize(file);
      await tx.update(sampleAttachments).set({ uploadedAt: new Date() }).where(eq(sampleAttachments.id, file.id));
    }
    await tx.update(sampleRequests).set({ uploadState: "complete", updatedAt: new Date(), lastError: null }).where(eq(sampleRequests.id, id));
    return { complete: true, id };
  });
}

export async function listSamples(status = "all", sort = "newest", uploads = "all") {
  const db = await database();
  return db.select({ id: sampleRequests.id, name: sampleRequests.name, email: sampleRequests.email, company: sampleRequests.company,
    category: sampleRequests.category, status: sampleRequests.status, uploadState: sampleRequests.uploadState, createdAt: sampleRequests.createdAt,
    // Aggregate an explicit join: a column interpolated in a single-table
    // SELECT expression may lose its qualifier in Drizzle, accidentally making
    // a correlated subquery compare attachment.request_id to attachment.id.
    count: sql<number>`count(${sampleAttachments.id})::int` })
    .from(sampleRequests).leftJoin(sampleAttachments, eq(sampleAttachments.requestId, sampleRequests.id)).where(and(
      ["new", "reviewing", "contacted", "closed"].includes(status) ? eq(sampleRequests.status, status as "new") : undefined,
      uploads === "incomplete" ? sql`${sampleRequests.uploadState} != 'complete'` : undefined,
    )).groupBy(sampleRequests.id).orderBy(sort === "oldest" ? asc(sampleRequests.createdAt) : desc(sampleRequests.createdAt)).limit(200);
}
export async function getSample(id: string) {
  const db = await database();
  return db.transaction(async (tx) => requestWithFiles(tx, id));
}
export async function saveAdminSample(input: unknown, id?: string) {
  const parsed = adminSampleSchema.safeParse(input);
  if (!parsed.success) throw new SampleError(400, parsed.error.issues[0]?.message ?? "Invalid request.");
  const db = await database();
  if (!id) {
    const [created] = await db.insert(sampleRequests).values({ ...parsed.data, uploadState: "complete" }).returning({ id: sampleRequests.id });
    return created;
  }
  const [updated] = await db.update(sampleRequests).set({ ...parsed.data, updatedAt: new Date() }).where(eq(sampleRequests.id, id)).returning({ id: sampleRequests.id });
  if (!updated) throw new SampleError(404, "Request not found.");
  return updated;
}

export async function deleteSample(id: string) {
  const db = await database();
  return db.transaction(async (tx) => {
    await lock(tx, id);
    const { request, files } = await requestWithFiles(tx, id);
    let error = "";
    try {
      if (files.length) {
        const storage = await privateSampleStorage();
        for (const file of files) {
          await storage.remove(file);
          await tx.update(sampleAttachments).set({ deletedAt: new Date() }).where(eq(sampleAttachments.id, file.id));
        }
      }
    } catch { error = "Some files could not be removed. The request is retained; retry deletion when storage is available."; }
    if (!error && files.length && request.writeSasExpiresAt && request.writeSasExpiresAt.getTime() > Date.now()) {
      error = `Files removed. Final cleanup can be retried after ${request.writeSasExpiresAt.toISOString()} when outstanding upload links expire.`;
    }
    if (error) {
      await tx.update(sampleRequests).set({ uploadState: "delete_failed", uploadTokenHash: null, lastError: error, updatedAt: new Date() }).where(eq(sampleRequests.id, id));
      return { deleted: false, error };
    }
    await tx.delete(sampleRequests).where(eq(sampleRequests.id, id));
    return { deleted: true };
  });
}
export async function attachmentAccess(id: string, attachmentId: string, preview: boolean) {
  const { request, files } = await getSample(id);
  const attachment = files.find((file) => file.id === attachmentId && file.uploadedAt && !file.deletedAt);
  if (!attachment || request.uploadState === "delete_failed") throw new SampleError(404, "Attachment is unavailable or incomplete.");
  const storage = await privateSampleStorage();
  if (!(await storage.validBlob(attachment.storageKey, attachment))) throw new SampleError(404, "Attachment not found in private storage.");
  return { url: storage.downloadUrl(attachment, preview), contentType: attachment.contentType, expiresInSeconds: 300 };
}

export async function cleanupSampleStaging(id: string) {
  const db = await database();
  return db.transaction(async (tx) => {
    await lock(tx, id);
    const { request, files } = await requestWithFiles(tx, id);
    if (request.uploadState !== "complete" || (request.writeSasExpiresAt && request.writeSasExpiresAt.getTime() > Date.now())) {
      throw new SampleError(409, "Staging cleanup is available after completion and upload-link expiry.");
    }
    const storage = await privateSampleStorage();
    for (const file of files) await storage.cleanupStaging(file);
    return { cleaned: true };
  });
}
