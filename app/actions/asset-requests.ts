"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { users, assetRequests, assetRequestMedia } from "@/lib/db/schema";
import {
  assetRequestSchema,
  fieldErrors,
  type AssetRequestInput,
} from "@/lib/validation";
import { maxBytesForKind } from "@/lib/storage/upload-constants";
import { publicUrlFor, statObject } from "@/lib/storage";
import { getClientIp } from "@/lib/http/request-context";
import { enforceRateLimits, RATE_LIMITS } from "@/lib/http/rate-limit";
import { notifyNewAssetRequest } from "@/lib/email";

export type SubmitRequestResult =
  | { ok: true; requestId: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/**
 * Public asset-request submission. Called imperatively by the modal AFTER the
 * client has uploaded any media to storage via presigned URLs.
 *
 * Flow: validate -> rate limit (IP + email) -> ensure a user row for the email
 * -> persist request + media in one transaction -> send the requester a magic
 * link so they can verify and vote -> notify the team. The request is saved
 * even if the magic link / notification email hiccups.
 */
export async function submitAssetRequest(
  input: AssetRequestInput,
): Promise<SubmitRequestResult> {
  const parsed = assetRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrors(parsed.error),
    };
  }
  const data = parsed.data;
  const email = data.email.trim().toLowerCase();

  const ip = await getClientIp();
  const rl = await enforceRateLimits([
    { bucket: `submit:ip:${ip}`, ...RATE_LIMITS.submitPerIp },
    { bucket: `submit:email:${email}`, ...RATE_LIMITS.submitPerEmail },
  ]);
  if (!rl.ok) {
    return {
      ok: false,
      error: "You have submitted several requests already. Try again later.",
    };
  }

  // Best-effort server-side verification of uploaded objects against claims.
  for (const m of data.media) {
    const stat = await statObject(m.storageKey);
    if (stat) {
      if (stat.sizeBytes > maxBytesForKind(m.kind)) {
        return { ok: false, error: "An uploaded file is too large." };
      }
    }
  }

  let requestId: string;
  try {
    requestId = await db.transaction(async (tx) => {
      // Ensure a user for this email (unverified until they click the link).
      const existing = await tx
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      let userId: string;
      if (existing[0]) {
        userId = existing[0].id;
        if (!existing[0].name && data.name) {
          await tx
            .update(users)
            .set({ name: data.name })
            .where(eq(users.id, userId));
        }
      } else {
        const inserted = await tx
          .insert(users)
          .values({ email, name: data.name })
          .returning({ id: users.id });
        userId = inserted[0]!.id;
      }

      const [request] = await tx
        .insert(assetRequests)
        .values({
          userId,
          title: data.title,
          description: data.description?.trim() || null,
          organization: data.organization?.trim() || null,
        })
        .returning({ id: assetRequests.id });

      if (data.media.length > 0) {
        await tx.insert(assetRequestMedia).values(
          data.media.map((m) => ({
            requestId: request!.id,
            storageKey: m.storageKey,
            url: publicUrlFor(m.storageKey),
            mimeType: m.mimeType,
            sizeBytes: m.sizeBytes,
            kind: m.kind,
          })),
        );
      }

      return request!.id;
    });
  } catch {
    return {
      ok: false,
      error: "Could not save your request. Please try again.",
    };
  }

  // Side effect (non-fatal): notify the team of the new request.
  try {
    await notifyNewAssetRequest({
      title: data.title,
      requesterName: data.name,
      email,
      hasMedia: data.media.length > 0,
      requestId,
    });
  } catch {
    // Non-fatal.
  }

  revalidatePath("/");
  return { ok: true, requestId };
}
