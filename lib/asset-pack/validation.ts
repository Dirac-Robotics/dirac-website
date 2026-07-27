import { z } from "zod";

export const assetDownloadRequestSchema = z.object({
  email: z.email({ message: "Enter a valid email address." }).max(320),
  name: z.string().trim().max(120).optional(),
  company: z.string().trim().max(160).optional(),
  bundleId: z.enum(["purple-chair", "table", "hammer-v2", "all-assets"]),
  termsVersion: z.literal("evaluation-beta-v1"),
  termsAccepted: z.literal(true),
  marketingConsent: z.boolean().default(false),
});

export const assetEventSchema = z.object({
  event: z.enum([
    "viewer_open",
    "proof_play",
    "proof_scrub",
    "download_gate_open",
    "download_unlocked",
    "experiment_select",
  ]),
  sessionId: z.uuid(),
  path: z.literal("/asset-pack"),
  assetSlug: z.string().trim().max(80).optional(),
  bundleId: z.string().trim().max(80).optional(),
  experimentId: z.string().trim().max(120).optional(),
});
