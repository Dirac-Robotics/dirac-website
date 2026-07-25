import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Check your email",
  robots: { index: false, follow: false },
};

export default function CheckEmailPage() {
  return (
    <main className="relative flex flex-1 flex-col">
      <section className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-32">
        <div className="eyebrow mb-5">Check your email</div>
        <h1 className="mb-4 text-4xl leading-[1.05] tracking-[-0.02em] text-foreground">
          Link sent.
        </h1>
        <p className="prose-body">
          We sent a sign-in link to your inbox. Open it on this device to
          confirm your email and continue. The link expires shortly. You can
          close this tab.
        </p>
      </section>
    </main>
  );
}
