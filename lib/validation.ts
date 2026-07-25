/**
 * Zod validation schemas. Imported by BOTH client (inline UX validation) and
 * server (authoritative validation). Zod v4. No server-only imports here.
 */
import { z } from "zod";

import {
  ALL_UPLOAD_MIME_TYPES,
  MAX_VIDEO_BYTES,
  kindForMime,
  maxBytesForKind,
} from "@/lib/upload-constants";

// ── Primitives ───────────────────────────────────────────────────────────────

const email = z.email({ message: "Enter a valid email address." }).max(320);
const shortText = z.string().trim().min(1).max(140);

// ── Leads (Contact + compact forms) ──────────────────────────────────────────

export const LEAD_INTERESTS = ["real2sim", "evals", "assets", "other"] as const;
export type LeadInterest = (typeof LEAD_INTERESTS)[number];

export const leadSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  email,
  company: z.string().trim().max(160).optional().or(z.literal("")),
  interest: z.enum(LEAD_INTERESTS),
  message: z.string().trim().max(4000).optional().or(z.literal("")),
  // Recorded, not user-facing. Which page the lead came from.
  sourcePage: z.string().trim().max(120).optional(),
});
export type LeadInput = z.infer<typeof leadSchema>;

// ── Asset requests ───────────────────────────────────────────────────────────

/**
 * One uploaded media item. The client uploads directly to object storage via a
 * presigned URL, then sends these descriptors to the submit action. The server
 * re-validates mime + size and confirms the object exists before persisting.
 */
export const mediaDescriptorSchema = z.object({
  storageKey: z.string().trim().min(1).max(512),
  mimeType: z.enum(ALL_UPLOAD_MIME_TYPES),
  sizeBytes: z.number().int().positive().max(MAX_VIDEO_BYTES),
  kind: z.enum(["image", "video"]),
});
export type MediaDescriptor = z.infer<typeof mediaDescriptorSchema>;

export const assetRequestSchema = z
  .object({
    // Requester identity (drives the account + leaderboard "requester name").
    name: z.string().trim().min(1, "Your name is required.").max(120),
    email,
    // The asset being requested — shown as the leaderboard row title.
    title: shortText,
    description: z.string().trim().max(5000).optional().or(z.literal("")),
    media: z.array(mediaDescriptorSchema).max(6).default([]),
  })
  .refine(
    (v) =>
      (v.description && v.description.trim().length > 0) || v.media.length > 0,
    {
      message: "Add a description or upload at least one file.",
      path: ["description"],
    },
  );
export type AssetRequestInput = z.infer<typeof assetRequestSchema>;

// ── Votes ────────────────────────────────────────────────────────────────────

/**
 * Anonymous upvote toggle. `upvote: true` adds this browser's upvote, `false`
 * removes it. The browser tracks its own upvoted state in localStorage; the
 * server only adjusts the denormalized score and is rate-limited by IP.
 */
export const upvoteSchema = z.object({
  requestId: z.uuid(),
  upvote: z.boolean(),
});
export type UpvoteInput = z.infer<typeof upvoteSchema>;

// ── Presigned upload requests ────────────────────────────────────────────────

export const presignSchema = z
  .object({
    filename: z.string().trim().min(1).max(256),
    mimeType: z.enum(ALL_UPLOAD_MIME_TYPES),
    sizeBytes: z.number().int().positive(),
  })
  .refine(
    (v) => {
      const kind = kindForMime(v.mimeType);
      return kind !== null && v.sizeBytes <= maxBytesForKind(kind);
    },
    {
      message: "File exceeds the allowed size for its type.",
      path: ["sizeBytes"],
    },
  );
export type PresignInput = z.infer<typeof presignSchema>;

// ── Admin ────────────────────────────────────────────────────────────────────

export const REQUEST_STATUSES = [
  "submitted",
  "under_review",
  "accepted",
  "building",
  "shipped",
  "rejected",
] as const;

export const MODERATION_STATES = ["visible", "flagged", "hidden"] as const;

export const updateRequestStatusSchema = z.object({
  requestId: z.uuid(),
  status: z.enum(REQUEST_STATUSES),
});

export const updateModerationSchema = z.object({
  requestId: z.uuid(),
  moderationState: z.enum(MODERATION_STATES),
});

// ── Error helper ─────────────────────────────────────────────────────────────

/** Flatten a ZodError into { field: firstMessage }. Zod-v4 safe. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
