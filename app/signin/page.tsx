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
    <main id="content" className="relative flex flex-1 flex-col">
      <section className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-32">
        <div className="eyebrow mb-5">Private team access</div>
        <h1 className="mb-4 text-4xl leading-[1.05] tracking-[-0.02em] text-foreground">
          Your request inbox.
        </h1>
        <p className="prose-body mb-10">
          Sign in with your authorized Dirac team email. We’ll send a secure
          sign-in link. Access is limited to team members with an admin role.
        </p>
        <SignInForm next={next || "/admin/samples"} />
      </section>
    </main>
  );
}
