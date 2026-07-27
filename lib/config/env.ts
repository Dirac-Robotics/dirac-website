/**
 * Environment variable validation. Import this instead of touching
 * `process.env` directly on the server so a missing/typo'd key fails loudly
 * at startup rather than at the first request.
 *
 * Server-only. Do NOT import from a Client Component. Client code only ever
 * needs `NEXT_PUBLIC_*` values, which Next inlines at build time.
 */
import { z } from "zod";

const serverSchema = z.object({
  // Postgres (Supabase or Neon). Use the pooled connection string on Vercel.
  DATABASE_URL: z.url(),

  // Auth.js
  AUTH_SECRET: z.string().min(1),
  // Optional on Vercel (auto-detected); set for local/preview if needed.
  AUTH_URL: z.url().optional(),

  // Azure Communication Services (ACS) Email: magic-link delivery + team
  // notifications. Connection string from the ACS resource's keys.
  ACS_CONNECTION_STRING: z.string().min(1),
  // ACS sender address on the linked (Azure-managed) domain, e.g.
  // "DoNotReply@<id>.azurecomm.net".
  EMAIL_FROM: z.string().min(1),
  // Where new-request / new-lead notifications are sent.
  ADMIN_NOTIFY_EMAIL: z.email(),

  // Azure Blob Storage (object storage for uploads). The account key is
  // server-only and used to mint short-lived write SAS upload URLs. The
  // container has anonymous blob read, so stored URLs render directly.
  AZURE_STORAGE_ACCOUNT: z.string().min(1),
  AZURE_STORAGE_KEY: z.string().min(1),
  AZURE_STORAGE_CONTAINER: z.string().min(1).default("media"),
  // Private container for simulation ZIPs. Unlike the public media container,
  // bundles are read only through short-lived SAS URLs.
  AZURE_ASSET_BUNDLE_CONTAINER: z
    .string()
    .min(1)
    .default("asset-bundles"),

  // Public origin, e.g. https://diracrobotics.com. Used in emails + metadata.
  SITE_URL: z.url().default("http://localhost:3000"),
});

const parsed = serverSchema.safeParse(process.env);

if (!parsed.success) {
  const flat = parsed.error.issues
    .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
  throw new Error(
    `Invalid or missing environment variables:\n${flat}\n\nSee .env.example for the full list.`,
  );
}

export const env = parsed.data;
