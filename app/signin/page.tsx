import type { Metadata } from "next";

import { SignInForm } from "@/components/auth/signin-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="relative flex flex-1 flex-col">
      <section className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-32">
        <div className="eyebrow mb-5">Sign in</div>
        <h1 className="mb-4 text-4xl leading-[1.05] tracking-[-0.02em] text-foreground">
          Verify your email.
        </h1>
        <p className="prose-body mb-10">
          We use passwordless sign-in. Enter your email and we will send a link.
          Confirming it verifies your account so your vote counts.
        </p>
        <SignInForm next={next} />
      </section>
    </main>
  );
}
