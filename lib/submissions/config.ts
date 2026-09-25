import "server-only";
import { z } from "zod";
import { DEFAULT_LIMITS, type SampleLimits } from "./validation";

// Optional subsystem: read and validate its readiness without importing the
// legacy startup-throwing env module into the marketing homepage.
const schema = z.object({
  DATABASE_URL: z.url(),
  AZURE_STORAGE_ACCOUNT: z.string().min(1),
  AZURE_STORAGE_KEY: z.string().min(1),
  AZURE_SAMPLE_CONTAINER: z.string().regex(/^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$/),
  AZURE_SAMPLE_BLOB_ENDPOINT: z.url().optional(),
  SAMPLE_MAX_FILES: z.coerce.number().int().min(1).max(100).default(DEFAULT_LIMITS.maxFiles),
  SAMPLE_MAX_FILE_BYTES: z.coerce.number().int().min(1).max(2 * 1024 ** 3).default(DEFAULT_LIMITS.maxFileBytes),
  SAMPLE_MAX_TOTAL_BYTES: z.coerce.number().int().min(1).max(10 * 1024 ** 3).default(DEFAULT_LIMITS.maxTotalBytes),
});
export function getSampleConfig() {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) return null;
  const value = parsed.data;
  if (value.AZURE_SAMPLE_CONTAINER === (process.env.AZURE_STORAGE_CONTAINER ?? "media") ||
      value.AZURE_SAMPLE_CONTAINER === (process.env.AZURE_ASSET_BUNDLE_CONTAINER ?? "asset-bundles")) return null;
  if (value.AZURE_SAMPLE_BLOB_ENDPOINT) {
    const endpoint = new URL(value.AZURE_SAMPLE_BLOB_ENDPOINT);
    // Only local development emulators may use a non-Azure endpoint.
    if (process.env.NODE_ENV === "production" || !["localhost", "127.0.0.1", "[::1]"].includes(endpoint.hostname)) return null;
  }
  return value;
}
export function getSampleLimits(): SampleLimits {
  const config = getSampleConfig();
  return config ? { maxFiles: config.SAMPLE_MAX_FILES, maxFileBytes: config.SAMPLE_MAX_FILE_BYTES, maxTotalBytes: config.SAMPLE_MAX_TOTAL_BYTES } : DEFAULT_LIMITS;
}
