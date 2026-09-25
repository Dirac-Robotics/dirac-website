import "server-only";
import { z } from "zod";
import { SampleError } from "./errors";

export function sampleJson(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { "Cache-Control": "no-store, private", "X-Content-Type-Options": "nosniff" } });
}
export async function sampleRoute(action: () => Promise<Response>) {
  try { return await action(); }
  catch (error) {
    if (error instanceof SampleError) return sampleJson({ error: error.message }, error.status);
    // Do not expose database details, object keys or credential-bearing errors.
    return sampleJson({ error: "The request service is temporarily unavailable. Your upload is not confirmed. Retry or book a call." }, 503);
  }
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const configured = process.env.SITE_URL;
  const allowed = new Set([new URL(request.url).origin, ...(configured ? [new URL(configured).origin] : [])]);
  if ((origin && !allowed.has(origin)) || request.headers.get("sec-fetch-site") === "cross-site") throw new SampleError(403, "This request origin is not allowed.");
}
export async function jsonInput(request: Request) {
  sameOrigin(request);
  if (!request.headers.get("content-type")?.includes("application/json")) throw new SampleError(415, "Send JSON metadata; upload files directly to storage.");
  if (Number(request.headers.get("content-length")) > 100_000) throw new SampleError(413, "Request metadata is too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new SampleError(400, "Missing request data.");
  let total = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > 100_000) { await reader.cancel(); throw new SampleError(413, "Request metadata is too large."); }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new SampleError(400, "Invalid JSON."); }
}
export function uuid(value: string) {
  if (!z.uuid().safeParse(value).success) throw new SampleError(404, "Request not found.");
  return value;
}
export function uploadToken(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  if (!/^[a-f0-9]{64}$/.test(token)) throw new SampleError(403, "A valid upload link is required.");
  return token;
}
export async function adminAccess(request?: Request) {
  if (request && request.method !== "GET") sameOrigin(request);
  const { getCurrentUser } = await import("@/lib/auth/session");
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") throw new SampleError(403, "Authorized team access is required.");
  return user;
}
