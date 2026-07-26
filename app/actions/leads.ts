"use server";

import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { leadSchema, fieldErrors } from "@/lib/validation";
import { getClientIp } from "@/lib/http/request-context";
import { enforceRateLimits, RATE_LIMITS } from "@/lib/http/rate-limit";
import { notifyNewLead } from "@/lib/email";

export type LeadFormState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

export async function submitLead(
  _prev: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const parsed = leadSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    company: formData.get("company") ?? "",
    interest: formData.get("interest"),
    message: formData.get("message") ?? "",
    sourcePage: formData.get("sourcePage") ?? undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: fieldErrors(parsed.error),
    };
  }
  const data = parsed.data;
  const email = data.email.trim().toLowerCase();

  const ip = await getClientIp();
  const rl = await enforceRateLimits([
    { bucket: `lead:ip:${ip}`, ...RATE_LIMITS.leadPerIp },
    { bucket: `lead:email:${email}`, ...RATE_LIMITS.leadPerEmail },
  ]);
  if (!rl.ok) {
    return {
      status: "error",
      message: "We already have your message. We will be in touch soon.",
    };
  }

  try {
    await db.insert(leads).values({
      name: data.name,
      email,
      company: data.company?.trim() || null,
      interest: data.interest,
      message: data.message?.trim() || null,
      sourcePage: data.sourcePage || null,
    });
  } catch {
    return {
      status: "error",
      message: "Could not send your message. Please try again.",
    };
  }

  try {
    await notifyNewLead({
      name: data.name,
      email,
      company: data.company,
      interest: data.interest,
      sourcePage: data.sourcePage,
    });
  } catch {
    // Non-fatal: the lead is stored.
  }

  return { status: "success" };
}
