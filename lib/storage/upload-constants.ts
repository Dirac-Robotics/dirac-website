/**
 * Upload limits and allowed types. Shared between client (to pre-validate and
 * show caps) and server (which re-validates, since the client is assumed hostile).
 */

export const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

export const ALL_UPLOAD_MIME_TYPES = [
  ...IMAGE_MIME_TYPES,
  ...VIDEO_MIME_TYPES,
] as const;

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB

export type MediaKind = "image" | "video";

export function kindForMime(mime: string): MediaKind | null {
  if ((IMAGE_MIME_TYPES as readonly string[]).includes(mime)) return "image";
  if ((VIDEO_MIME_TYPES as readonly string[]).includes(mime)) return "video";
  return null;
}

export function maxBytesForKind(kind: MediaKind): number {
  return kind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
}

/** `accept` attribute for the file input. */
export const UPLOAD_ACCEPT = ALL_UPLOAD_MIME_TYPES.join(",");

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}
