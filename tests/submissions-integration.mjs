// Run against an already-started isolated dev server and migrated local DB:
// Explicit DATABASE_URL, SITE_URL and AZURE_SAMPLE_* / AZURE_STORAGE_* local
// settings are required. See docs/SAMPLE_REQUESTS.md for names and setup.
// Never reads .env. Refuses non-loopback database/site endpoints.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { BlockBlobClient } from "@azure/storage-blob";
import { probePrivateStorage } from "./submissions-storage-probe.mjs";

const site = new URL(process.env.SITE_URL ?? "http://localhost:3000");
const databaseUrl = process.env.DATABASE_URL;
assert.ok(databaseUrl, "Explicit isolated DATABASE_URL is required.");
const database = new URL(databaseUrl);
for (const endpoint of [site, database]) assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(endpoint.hostname), "Only loopback test environments are allowed.");
assert.match(database.pathname, /test|local/, "Database name must explicitly identify test/local usage.");
const db = postgres(databaseUrl, { prepare: false, max: 2 });
const run = randomUUID();
const adminId = randomUUID();
const userId = randomUUID();
const adminToken = `samples-test-admin-${run}`;
const userToken = `samples-test-user-${run}`;
const requestIds = new Set();
const sentinelIds = { assets: randomUUID(), asset_requests: randomUUID(), leads: randomUUID(), votes: randomUUID() };
let assertions = 0;
const check = (condition, message) => { assert.ok(condition, message); assertions++; console.log(`PASS ${message}`); };
async function api(path, { method = "GET", body, cookie, token, ip, origin = site.origin } = {}) {
  const response = await fetch(new URL(path, site), {
    method, redirect: "manual", headers: { Origin: origin, ...(body ? { "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: `authjs.session-token=${cookie}` } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(ip ? { "X-Forwarded-For": ip } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const raw = await response.text();
  let data;
  try { data = JSON.parse(raw); } catch { data = raw; }
  return { status: response.status, data, headers: response.headers };
}
function manifest(extra = {}) {
  return { name: "Synthetic Sample Tester", email: `sample-${randomUUID()}@example.test`, company: `Synthetic ${run}`, category: "scene_videos", description: "Local integration fixture, safe to delete.", files: [{ originalFilename: "trajectory.json", relativePath: "warehouse/trajectory.json", sizeBytes: 42 }], ...extra };
}
async function create(body = manifest()) {
  const result = await api("/api/samples", { method: "POST", body, ip: `local-test-${randomUUID()}` });
  assert.equal(result.status, 201, JSON.stringify(result.data));
  requestIds.add(result.data.id);
  return result.data;
}
async function upload(ticket, bytes) {
  const blob = new BlockBlobClient(ticket.files[0].url);
  await blob.uploadData(bytes, { blobHTTPHeaders: { blobContentType: "application/json" } });
}
const baseline = {};
const sentinelRows = {};
try {
  await db`insert into users (id, name, email, email_verified, role) values (${adminId}, 'Synthetic Admin', ${`admin-${run}@example.test`}, now(), 'admin'), (${userId}, 'Synthetic Visitor', ${`user-${run}@example.test`}, now(), 'user')`;
  await db`insert into sessions (session_token,user_id,expires) values (${adminToken}, ${adminId}, now() + interval '1 hour'), (${userToken}, ${userId}, now() + interval '1 hour')`;
  // Nonempty, unrelated fixtures catch accidental broad deletes or updates,
  // rather than merely confirming that originally empty tables remain empty.
  await db`insert into assets (id, name, slug, description, physics, published) values (${sentinelIds.assets}, 'Synthetic untouched asset', ${`sentinel-${run}`}, 'Preserve every field', '{"mass":{"value":2.3,"unit":"kg"}}'::jsonb, false)`;
  await db`insert into asset_requests (id,user_id,title,description,organization,moderation_state,vote_score) values (${sentinelIds.asset_requests},${userId},'Synthetic untouched request','Preserve original request','Sentinel organization','hidden',1)`;
  await db`insert into leads (id,email,name,company,interest,message,source_page) values (${sentinelIds.leads},${`lead-${run}@example.test`},'Synthetic untouched lead','Sentinel organization','other','Preserve original message','synthetic integration sentinel')`;
  await db`insert into votes (id,request_id,user_id,value) values (${sentinelIds.votes},${sentinelIds.asset_requests},${userId},1)`;
  for (const table of Object.keys(sentinelIds)) {
    baseline[table] = Number((await db`select count(*) as count from ${db(table)}`)[0].count);
    sentinelRows[table] = (await db`select * from ${db(table)} where id=${sentinelIds[table]}`)[0];
  }
  check((await api("/api/admin/samples")).status === 403, "anonymous users cannot list private requests");
  check((await api("/api/admin/samples", { cookie: userToken })).status === 403, "non-admin sessions cannot list private requests");
  check((await api("/admin/samples", { cookie: userToken })).status === 404, "non-admin direct inbox page access is denied");
  check((await api("/api/samples")).status === 405, "public endpoint has no list operation");
  check((await api("/api/samples", { method: "POST", body: manifest(), origin: "https://untrusted.example" })).status === 403, "cross-origin public creation is rejected");
  check((await api("/api/admin/samples", { method: "POST", body: manifest(), cookie: adminToken, origin: "https://untrusted.example" })).status === 403, "cross-origin admin mutation is rejected despite a valid session");
  await probePrivateStorage(check);

  const limitedTicket = await create();
  for (let attempt = 0; attempt < 30; attempt++) {
    const result = await api(`/api/samples/${limitedTicket.id}/complete`, { method: "POST", token: limitedTicket.token });
    assert.equal(result.status, 409, "An incomplete upload should be rejected before the attempt limit is reached.");
  }
  const [attempts] = await db`select count(*)::int as count from rate_limit_events where bucket=${`sample:complete:${limitedTicket.id}`}`;
  check(attempts.count === 30, "failed finalization attempts remain counted after their transaction fails");
  check((await api(`/api/samples/${limitedTicket.id}/complete`, { method: "POST", token: limitedTicket.token })).status === 429, "attempt 31 is rate-limited after 30 failed finalizations");

  for (const body of [manifest({ files: [] }), manifest({ email: "invalid" }), manifest({ files: [{ originalFilename: "script.html", relativePath: "script.html", sizeBytes: 8 }] }), manifest({ files: [{ originalFilename: "scene.mp4", relativePath: "scene.mp4", sizeBytes: 11 * 1024 ** 3 }] }), manifest({ files: [{ originalFilename: "scene.mp4", relativePath: "../scene.mp4", sizeBytes: 8 }] })]) {
    check((await api("/api/samples", { method: "POST", body })).status === 400, "invalid/unsupported/oversized/traversal manifest rejected");
  }
  const ticket = await create();
  check((await db`select id from sample_requests where id=${ticket.id}`).length === 1, "request metadata durably exists before upload");
  const wrongToken = "0".repeat(64);
  check((await api(`/api/samples/${ticket.id}/resume`, { method: "POST", token: wrongToken })).status === 403, "another visitor cannot resume this request");
  check(Number((await db`select count(*) as count from rate_limit_events where bucket=${`sample:resume:${ticket.id}`}`)[0].count) === 0, "invalid capabilities cannot consume another visitor's resume quota");
  check((await api(`/api/samples/${ticket.id}/complete`, { method: "POST", token: ticket.token })).status === 409, "interrupted upload cannot produce success");
  check((await api(`/api/admin/samples/${ticket.id}`, { method: "PATCH", body: {}, cookie: userToken })).status === 403, "non-admin cannot update a request");
  check((await api(`/api/admin/samples/${ticket.id}`, { method: "DELETE" })).status === 403, "anonymous visitor cannot delete a request");
  await upload(ticket, Buffer.from("short"));
  check((await api(`/api/samples/${ticket.id}/complete`, { method: "POST", token: ticket.token })).status === 409, "actual blob size is checked, not merely claimed size");
  const resumed = await api(`/api/samples/${ticket.id}/resume`, { method: "POST", token: ticket.token });
  check(resumed.status === 200 && !resumed.data.files[0].uploaded, "partial upload remains resumable");
  const bytes = Buffer.alloc(42, "x");
  await upload(ticket, bytes);
  const anonymousBlob = new URL(ticket.files[0].url); anonymousBlob.search = "";
  check([403, 404, 409].includes((await fetch(anonymousBlob)).status), "staging blob is not anonymously readable");
  check((await fetch(ticket.files[0].url)).status === 403, "write-only upload SAS cannot read the blob");
  const complete = await api(`/api/samples/${ticket.id}/complete`, { method: "POST", token: ticket.token });
  check(complete.status === 200 && complete.data.complete, `upload finalizes after durable private copy (${JSON.stringify(complete.data)})`);
  const [stored] = await db`select * from sample_requests where id=${ticket.id}`;
  check(stored.upload_state === "complete", "completion persists across independent DB reads");
  const detail = await api(`/api/admin/samples/${ticket.id}`, { cookie: adminToken });
  check(detail.status === 200 && detail.data.files.length === 1, "authorized admin sees persisted details and attachment");
  const inbox = await api("/api/admin/samples", { cookie: adminToken });
  check(inbox.data.find((row) => row.id === ticket.id)?.count === detail.data.files.length, "inbox attachment count matches the independently loaded request details");
  check(!("uploadTokenHash" in detail.data.request), "admin JSON does not leak upload capability hashes");
  const fileId = detail.data.files[0].id;
  const filePath = `/api/admin/samples/${ticket.id}/attachments/${fileId}`;
  check((await api(filePath)).status === 403, "attachment grant requires an authorized session");
  const grant = await api(filePath, { cookie: adminToken });
  check(grant.status === 200 && grant.data.expiresInSeconds === 300, "admin receives a five-minute scoped read grant");
  check(Buffer.from(await (await fetch(grant.data.url)).arrayBuffer()).equals(bytes), "private download contains submitted bytes");
  const privateUrl = new URL(grant.data.url); privateUrl.search = "";
  check([403, 404, 409].includes((await fetch(privateUrl)).status), "committed object is not anonymously readable");
  await upload(ticket, Buffer.alloc(42, "y"));
  check(Buffer.from(await (await fetch(grant.data.url)).arrayBuffer()).equals(bytes), "reusing an upload SAS cannot overwrite committed samples");
  const contact = { ...manifest() };
  delete contact.files;
  const changed = { ...contact, status: "reviewing", internalNotes: "Synthetic private note" };
  check((await api(`/api/admin/samples/${ticket.id}`, { method: "PATCH", cookie: adminToken, body: changed })).status === 200, "admin can update status and internal notes");
  const reread = await api(`/api/admin/samples/${ticket.id}`, { cookie: adminToken });
  check(reread.data.request.internalNotes === changed.internalNotes && reread.data.request.status === "reviewing", "admin changes remain visible after refresh");
  const filtered = await api("/api/admin/samples?status=reviewing&sort=oldest", { cookie: adminToken });
  check(filtered.data.some((item) => item.id === ticket.id) && filtered.data.every((item) => item.status === "reviewing"), "status filters and sorting return persisted requests");

  const manual = await api("/api/admin/samples", { method: "POST", cookie: adminToken, body: changed });
  check(manual.status === 201, "admin manually creates a request without uploads");
  requestIds.add(manual.data.id);
  check((await api("/api/admin/samples", { cookie: adminToken })).data.find((row) => row.id === manual.data.id)?.count === 0, "inbox keeps requests without attachments visible with a zero count");
  check((await api(`/api/admin/samples/${manual.data.id}/attachments/${fileId}`, { cookie: adminToken })).status === 404, "attachment grants reject a valid file ID under the wrong request parent");
  check((await api(`/api/admin/samples/${manual.data.id}`, { method: "DELETE", cookie: adminToken })).status === 200, "manual request deletion completes immediately");
  requestIds.delete(manual.data.id);
  const deleted = await api(`/api/admin/samples/${ticket.id}`, { method: "DELETE", cookie: adminToken });
  check(deleted.status === 409 && !deleted.data.deleted, "deletion retains cleanup record while upload SAS is active");
  check((await api(`/api/samples/${ticket.id}/resume`, { method: "POST", token: ticket.token })).status === 403, "deletion immediately disables resume capability");
  check((await api(filePath, { cookie: adminToken })).status === 404, "deleted files cannot receive new download grants");
  // Only this isolated synthetic record's deadline is advanced. Its issued
  // upload URLs are never used again after this point.
  await db`update sample_requests set write_sas_expires_at=now()-interval '1 minute' where id=${ticket.id}`;
  check((await api(`/api/admin/samples/${ticket.id}`, { method: "DELETE", cookie: adminToken })).status === 200, "deletion retry completes after upload-link deadline");
  requestIds.delete(ticket.id);
  check((await db`select id from sample_attachments where request_id=${ticket.id}`).length === 0, "deletion removes attachment metadata");
  check((await fetch(grant.data.url)).status === 404, "deletion removes committed blob even before read-grant expiry");
  for (const table of Object.keys(baseline)) {
    check(Number((await db`select count(*) as count from ${db(table)}`)[0].count) === baseline[table], `${table} nonempty row count remains unchanged`);
    assert.deepEqual((await db`select * from ${db(table)} where id=${sentinelIds[table]}`)[0], sentinelRows[table]);
    check(true, `${table} unrelated sentinel preserves every field`);
  }
  console.log(`\n${assertions} integration checks passed using synthetic local data.`);
} finally {
  for (const id of requestIds) {
    try {
      await db`update sample_requests set write_sas_expires_at=now()-interval '1 minute' where id=${id}`;
      await api(`/api/admin/samples/${id}`, { method: "DELETE", cookie: adminToken });
    } catch { console.error(`Synthetic request retained for cleanup: ${id}`); }
  }
  for (const table of ["votes", "asset_requests", "leads", "assets"]) await db`delete from ${db(table)} where id=${sentinelIds[table]}`;
  await db`delete from sessions where session_token in (${adminToken}, ${userToken})`;
  await db`delete from users where id in (${adminId}, ${userId})`;
  await db.end();
}
