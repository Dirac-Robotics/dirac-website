import { NextResponse } from "next/server";

import { presignSchema, fieldErrors } from "@/lib/validation";
import { kindForMime } from "@/lib/upload-constants";
import { buildUploadKey, createSignedUpload } from "@/lib/storage";
import { getClientIp } from "@/lib/request-context";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * Issue a presigned URL so the browser uploads directly to object storage,
 * never through this server. Server-side validation of mime + size happens
 * here (client is untrusted); the submit action re-checks the stored object.
 */
export async function POST(req: Request) {
  const ip = await getClientIp();
  const rl = await checkRateLimit(
    `presign:ip:${ip}`,
    RATE_LIMITS.presignPerIp.limit,
    RATE_LIMITS.presignPerIp.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many upload requests. Try again later." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = presignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "That file is not allowed.", fieldErrors: fieldErrors(parsed.error) },
      { status: 400 },
    );
  }

  const { filename, mimeType } = parsed.data;
  const kind = kindForMime(mimeType); // non-null: schema already validated
  const key = buildUploadKey("requests", filename);

  try {
    const { signedUrl, storageKey, token } = await createSignedUpload(key);
    return NextResponse.json({ signedUrl, storageKey, token, kind });
  } catch {
    return NextResponse.json(
      { error: "Could not create an upload URL. Try again." },
      { status: 500 },
    );
  }
}
