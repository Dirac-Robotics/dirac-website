"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { assetRequests } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/session";
import { updateRequestStatusSchema, updateModerationSchema } from "@/lib/validation";

async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Forbidden");
  }
  return user;
}

export async function setRequestStatus(formData: FormData): Promise<void> {
  await assertAdmin();
  const parsed = updateRequestStatusSchema.safeParse({
    requestId: formData.get("requestId"),
    status: formData.get("status"),
  });
  if (!parsed.success) throw new Error("Invalid input");

  await db
    .update(assetRequests)
    .set({ status: parsed.data.status })
    .where(eq(assetRequests.id, parsed.data.requestId));

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function setModeration(formData: FormData): Promise<void> {
  await assertAdmin();
  const parsed = updateModerationSchema.safeParse({
    requestId: formData.get("requestId"),
    moderationState: formData.get("moderationState"),
  });
  if (!parsed.success) throw new Error("Invalid input");

  await db
    .update(assetRequests)
    .set({ moderationState: parsed.data.moderationState })
    .where(eq(assetRequests.id, parsed.data.requestId));

  revalidatePath("/admin");
  revalidatePath("/");
}
