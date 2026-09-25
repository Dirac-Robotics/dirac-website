import { z } from "zod";

export const SAMPLE_FORMATS = {
  mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm", m4v: "video/mp4",
  bag: "application/octet-stream", mcap: "application/octet-stream", db3: "application/octet-stream",
  h5: "application/octet-stream", hdf5: "application/octet-stream", npy: "application/octet-stream", npz: "application/octet-stream",
  csv: "text/csv", json: "application/json", jsonl: "application/x-ndjson",
  yaml: "application/yaml", yml: "application/yaml", txt: "text/plain",
  urdf: "application/xml", stl: "application/octet-stream", obj: "application/octet-stream",
  ply: "application/octet-stream", glb: "model/gltf-binary", zip: "application/zip",
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
} as const;
export const SAMPLE_ACCEPT = Object.keys(SAMPLE_FORMATS).map((ext) => `.${ext}`).join(",");
export const SAMPLE_CATEGORIES = { scene_videos: "Scene videos", teleoperation: "Robot teleoperation data" } as const;
export const SAMPLE_STATUSES = { new: "New", reviewing: "Reviewing", contacted: "Contacted", closed: "Closed" } as const;
export const DEFAULT_LIMITS = { maxFiles: 20, maxFileBytes: 500 * 1024 ** 2, maxTotalBytes: 2 * 1024 ** 3 };
export type SampleLimits = typeof DEFAULT_LIMITS;
export function formatBytes(bytes: number) {
  return bytes >= 1024 ** 3 ? `${(bytes / 1024 ** 3).toFixed(1)} GB` : bytes >= 1024 ** 2 ? `${(bytes / 1024 ** 2).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;
}
export function sampleContentType(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() as keyof typeof SAMPLE_FORMATS;
  return SAMPLE_FORMATS[ext] ?? null;
}
const safePath = z.string().trim().min(1).max(500).refine((path) =>
  !path.startsWith("/") && !path.includes("\\") && !/[\u0000-\u001f\u007f]/.test(path) &&
  path.split("/").every((part) => part !== ".." && part !== "." && part.length > 0), "Use a valid relative folder path.");
export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(120),
  email: z.email("Enter a valid work email.").max(254).transform((s) => s.toLowerCase()),
  company: z.string().trim().min(1, "Enter your company.").max(160),
  category: z.enum(["scene_videos", "teleoperation"]),
  description: z.string().trim().max(5000).default(""),
});
export const attachmentSchema = z.object({
  originalFilename: z.string().min(1).max(255).refine((v) => !/[\\/\u0000-\u001f\u007f]/.test(v), "Invalid filename.")
    .refine((v) => !!sampleContentType(v), "Unsupported file format."),
  relativePath: safePath,
  sizeBytes: z.number().int().positive(),
}).refine((v) => v.relativePath.split("/").pop() === v.originalFilename, "Filename and folder path must match.");
export function submissionSchema(limits: SampleLimits = DEFAULT_LIMITS) {
  return contactSchema.extend({
    website: z.string().max(0).optional(), // Honeypot. Hidden from keyboard/assistive technology.
    files: z.array(attachmentSchema).min(1, "Choose at least one sample.").max(limits.maxFiles)
      .refine((files) => files.every((f) => f.sizeBytes <= limits.maxFileBytes), "A file exceeds the per-file limit.")
      .refine((files) => files.reduce((sum, f) => sum + f.sizeBytes, 0) <= limits.maxTotalBytes, "The selected files exceed the total limit.")
      .refine((files) => new Set(files.map((f) => f.relativePath)).size === files.length, "Each file path must be unique."),
  });
}
export const adminSampleSchema = contactSchema.extend({ status: z.enum(["new", "reviewing", "contacted", "closed"]), internalNotes: z.string().max(20000).default("") });
export type SampleContact = z.infer<typeof contactSchema>;
export type UploadFile = z.infer<typeof attachmentSchema>;
export type UploadTicket = { id: string; token: string; expiresAt: string; files: { id: string; relativePath: string; sizeBytes: number; uploaded: boolean; url?: string }[] };
