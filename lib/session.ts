/**
 * Server-side session helpers. Every admin/authenticated surface calls these on
 * the server. UI-level hiding is never the security boundary.
 */
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";

export type SessionUser = {
  id: string;
  role: "user" | "admin";
  email?: string | null;
  name?: string | null;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  return session?.user ?? null;
}

/** For pages that require any signed-in (verified) user. */
export async function requireUser(nextPath = "/"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/signin?next=${encodeURIComponent(nextPath)}`);
  return user;
}

/**
 * For admin surfaces. Redirects anonymous users to sign in; returns 404 for
 * signed-in non-admins so the existence of /admin is not confirmed.
 */
export async function requireAdmin(nextPath = "/admin"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/signin?next=${encodeURIComponent(nextPath)}`);
  if (user.role !== "admin") notFound();
  return user;
}
