"use server";

import { z } from "zod";

import { signIn, signOut } from "@/auth";

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

  // signIn throws a redirect to the verifyRequest page on success.
  await signIn("resend", {
    email: parsed.data.email,
    redirectTo: parsed.data.next || "/",
  });
  return {};
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
