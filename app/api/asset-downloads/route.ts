import { NextResponse } from "next/server";

import { assetBundleMap } from "@/lib/asset-pack/downloads";
import { assetDownloadRequestSchema } from "@/lib/asset-pack/validation";
import { db } from "@/lib/db";
import { assetPackDownloads } from "@/lib/db/schema";
import { enforceRateLimits, RATE_LIMITS } from "@/lib/http/rate-limit";
import { getClientIp } from "@/lib/http/request-context";
import { createAssetBundleDownload } from "@/lib/storage/asset-bundles";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const parsed = assetDownloadRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid email and accept the evaluation terms." },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const email = input.email.trim().toLowerCase();
  const bundle = assetBundleMap[input.bundleId];
  const ip = await getClientIp();
  const rateLimit = await enforceRateLimits([
    {
      bucket: `asset-download:ip:${ip}`,
      ...RATE_LIMITS.assetDownloadPerIp,
    },
    {
      bucket: `asset-download:email:${email}`,
      ...RATE_LIMITS.assetDownloadPerEmail,
    },
  ]);
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Too many download requests. Try again later." },
      { status: 429 },
    );
  }

  let signed: Awaited<ReturnType<typeof createAssetBundleDownload>>;
  try {
    signed = await createAssetBundleDownload(
      bundle.storageKey,
      bundle.filename,
    );
  } catch {
    return NextResponse.json(
      { error: "This bundle is not available in private storage yet." },
      { status: 503 },
    );
  }

  const now = new Date();
  try {
    await db.insert(assetPackDownloads).values({
      email,
      name: input.name?.trim() || null,
      company: input.company?.trim() || null,
      bundleId: input.bundleId,
      termsVersion: input.termsVersion,
      termsAcceptedAt: now,
      marketingConsent: input.marketingConsent,
      marketingConsentAt: input.marketingConsent ? now : null,
      retentionExpiresAt: new Date(
        now.getTime() + 365 * 24 * 60 * 60 * 1000,
      ),
    });
  } catch {
    return NextResponse.json(
      { error: "Could not record evaluation access." },
      { status: 503 },
    );
  }

  return NextResponse.json(
    {
      expiresAt: signed.expiresAt.toISOString(),
      downloads: [{ name: bundle.filename, url: signed.url }],
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
      },
    },
  );
}
