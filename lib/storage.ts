/**
 * Object storage (Azure Blob Storage). Server-only: uses the account key.
 *
 * Uploads never pass through the app server. The client asks for a short-lived
 * write SAS URL (`createSignedUpload`) and PUTs the file straight to the blob.
 * We never store binaries in Postgres — only the `storageKey` and public `url`.
 * The container has anonymous blob read, so stored URLs render directly.
 */
import "server-only";
import {
  BlobSASPermissions,
  BlobServiceClient,
  generateBlobSASQueryParameters,
  SASProtocol,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";

import { env } from "@/lib/env";

const credential = new StorageSharedKeyCredential(
  env.AZURE_STORAGE_ACCOUNT,
  env.AZURE_STORAGE_KEY,
);
const service = new BlobServiceClient(
  `https://${env.AZURE_STORAGE_ACCOUNT}.blob.core.windows.net`,
  credential,
);
const container = service.getContainerClient(env.AZURE_STORAGE_CONTAINER);

/** Build a collision-proof, path-traversal-safe object key. */
export function buildUploadKey(prefix: string, filename: string): string {
  const dot = filename.lastIndexOf(".");
  const rawExt = dot >= 0 ? filename.slice(dot + 1) : "";
  const ext = rawExt.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10).toLowerCase();
  const id = crypto.randomUUID();
  return ext ? `${prefix}/${id}.${ext}` : `${prefix}/${id}`;
}

/** Permanent public URL for a stored blob (container has anonymous blob read). */
export function publicUrlFor(storageKey: string): string {
  return container.getBlockBlobClient(storageKey).url;
}

export type SignedUpload = {
  // Short-lived write SAS URL the client PUTs the file to.
  uploadUrl: string;
  // Permanent public URL, persisted alongside the request.
  url: string;
  storageKey: string;
};

/** Mint a short-lived URL the client can PUT a single file to. */
export async function createSignedUpload(
  storageKey: string,
): Promise<SignedUpload> {
  const blob = container.getBlockBlobClient(storageKey);
  const now = Date.now();
  const sas = generateBlobSASQueryParameters(
    {
      containerName: env.AZURE_STORAGE_CONTAINER,
      blobName: storageKey,
      permissions: BlobSASPermissions.parse("cw"),
      protocol: SASProtocol.Https,
      startsOn: new Date(now - 5 * 60 * 1000),
      expiresOn: new Date(now + 15 * 60 * 1000),
    },
    credential,
  ).toString();
  return { uploadUrl: `${blob.url}?${sas}`, url: blob.url, storageKey };
}

/**
 * Read URL for rendering media. The container allows anonymous blob read, so
 * the permanent public URL is returned as-is. Accepts a stored key or URL.
 */
export async function getReadUrl(storageKey: string): Promise<string | null> {
  if (!storageKey) return null;
  return storageKey.startsWith("http") ? storageKey : publicUrlFor(storageKey);
}

/**
 * Best-effort server-side verification that an uploaded object exists and its
 * real size/type match what the client claimed. Returns null if unavailable;
 * callers still enforce schema caps.
 */
export async function statObject(
  storageKey: string,
): Promise<{ sizeBytes: number; mimeType: string } | null> {
  try {
    const props = await container.getBlockBlobClient(storageKey).getProperties();
    return {
      sizeBytes: props.contentLength ?? 0,
      mimeType: props.contentType ?? "application/octet-stream",
    };
  } catch {
    return null;
  }
}
