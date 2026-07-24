/**
 * Object storage (Supabase Storage). Server-only: uses the service role key.
 *
 * Uploads never pass through the app server. The client asks for a presigned
 * upload URL (`createSignedUpload`) and PUTs the file straight to storage.
 * We never store binaries in Postgres — only the `storageKey`.
 */
import "server-only";
import { createClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BUCKET = env.SUPABASE_STORAGE_BUCKET;

/** Build a collision-proof, path-traversal-safe object key. */
export function buildUploadKey(prefix: string, filename: string): string {
  const dot = filename.lastIndexOf(".");
  const rawExt = dot >= 0 ? filename.slice(dot + 1) : "";
  const ext = rawExt.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10).toLowerCase();
  const id = crypto.randomUUID();
  return ext ? `${prefix}/${id}.${ext}` : `${prefix}/${id}`;
}

export type SignedUpload = {
  signedUrl: string;
  storageKey: string;
  // Upload token. The client PUTs directly to `signedUrl`; if a given Supabase
  // version needs it, this token also works with supabase-js
  // `uploadToSignedUrl(path, token, file)` as a drop-in fallback.
  token: string;
};

/** Mint a short-lived URL the client can PUT a single file to. */
export async function createSignedUpload(
  storageKey: string,
): Promise<SignedUpload> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(storageKey);
  if (error || !data) {
    throw new Error(`Failed to create signed upload URL: ${error?.message}`);
  }
  return { signedUrl: data.signedUrl, storageKey: data.path, token: data.token };
}

/** Short-lived read URL for rendering private media (thumbnails, previews). */
export async function getSignedReadUrl(
  storageKey: string,
  expiresIn = 60 * 60,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storageKey, expiresIn);
  if (error || !data) return null;
  return data.signedUrl;
}

/**
 * Best-effort server-side verification that an uploaded object exists and its
 * real size/type match what the client claimed. Returns null if metadata is
 * unavailable (older storage API); callers still enforce schema caps.
 */
export async function statObject(
  storageKey: string,
): Promise<{ sizeBytes: number; mimeType: string } | null> {
  try {
    // `info` returns object metadata in recent supabase-js versions.
    const api = supabase.storage.from(BUCKET) as unknown as {
      info?: (
        path: string,
      ) => Promise<{ data: { size: number; contentType: string } | null }>;
    };
    if (typeof api.info === "function") {
      const { data } = await api.info(storageKey);
      if (data) return { sizeBytes: data.size, mimeType: data.contentType };
    }
  } catch {
    // fall through
  }
  return null;
}
