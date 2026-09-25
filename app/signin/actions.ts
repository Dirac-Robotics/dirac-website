"use server";

import { z } from "zod";

import { AuthError } from "next-auth";

const schema = z.object({
  email: z.email(),
  next: z.string().max(200).optional(),
});

export type SignInState = { error?: string };

export async function requestMagicLink(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    next: formData.get("next") || undefined,
  });
  if (!parsed.success) {
    return { error: "Enter a valid email address." };
  }

  const next = parsed.data.next;
  const redirectTo = next?.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : "/admin/samples";
  try {
    if (!process.env.ACS_CONNECTION_STRING || process.env.ACS_CONNECTION_STRING.includes("localhost.invalid")) {
      return { error: "Email sign-in is not configured in this preview. Contact your administrator for access." };
    }
    const { signIn } = await import("@/lib/auth");
    // Auth.js throws a redirect to the verifyRequest page on success.
    await signIn("email", { email: parsed.data.email.toLowerCase(), redirectTo });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Unable to send a sign-in link. Use your authorized team email or contact your administrator." };
    throw error;
  }
  return {};
}

export async function signOutAction(): Promise<void> {
  const { signOut } = await import("@/lib/auth");
  await signOut({ redirectTo: "/" });
}
