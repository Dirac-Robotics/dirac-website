/**
 * Auth.js (NextAuth v5) — passwordless email magic link via Resend, with a
 * Drizzle/Postgres adapter and database-backed sessions.
 *
 * Why database sessions: a valid session only exists after the user clicks the
 * magic link, which also sets `users.email_verified`. So "has a session" is
 * equivalent to "verified email", which is exactly the vote-integrity gate.
 */
import NextAuth, { type DefaultSession } from "next-auth";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";

import { db } from "@/lib/db";
import { users, accounts, sessions, verificationTokens } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { sendMagicLink } from "@/lib/email";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "user" | "admin";
    } & DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "database" },
  trustHost: true,
  pages: {
    signIn: "/signin",
    verifyRequest: "/signin/check-email",
  },
  providers: [
    Resend({
      apiKey: env.RESEND_API_KEY,
      from: env.EMAIL_FROM,
      // Deliver our own branded email instead of the default template.
      async sendVerificationRequest({ identifier, url }) {
        await sendMagicLink(identifier, url);
      },
    }),
  ],
  callbacks: {
    // Database strategy: `user` is the full DB row, so role is present.
    session({ session, user }) {
      session.user.id = user.id;
      session.user.role =
        (user as unknown as { role?: "user" | "admin" }).role ?? "user";
      return session;
    },
  },
});
