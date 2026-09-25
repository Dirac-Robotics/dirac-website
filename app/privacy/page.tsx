import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Sample privacy",
  description: "How Dirac handles contact details and submitted robot samples.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return <main id="content" className="site-container py-20 md:py-28">
    <Link href="/#submit" className="text-sm underline underline-offset-4">← Back to sample submission</Link>
    <div className="mt-12 max-w-3xl space-y-8">
      <p className="eyebrow">Sample submissions / privacy</p>
      <h1 className="text-4xl md:text-6xl">Your data, handled privately.</h1>
      <p className="prose-lead">When you send a request, Dirac receives your name, work email, company, optional description, and the files you choose to submit. Selecting a file alone does not upload it.</p>
      <section><h2 className="mb-3 text-2xl">Why we collect it</h2><p className="prose-body">We use these details to review your robotics project and respond to your request. Submitting samples does not automatically start reconstruction, policy training, or other processing services.</p></section>
      <section><h2 className="mb-3 text-2xl">Storage and access</h2><p className="prose-body">Request details and file metadata are stored in our database. Samples are stored in private Azure Blob Storage. Authorized Dirac administrators can review the request and access files through time-limited links. Files are not placed in the public asset gallery.</p></section>
      <section><h2 className="mb-3 text-2xl">Unfinished requests and deletion</h2><p className="prose-body">An interrupted upload can leave an incomplete request so that you can retry. We retain submitted requests until a team member deletes them. You can request deletion or correction by emailing <a href={`mailto:${SITE.contactEmail}`} className="underline underline-offset-4">{SITE.contactEmail}</a>. File deletion may need a retry if storage is unavailable or an upload link has not yet expired.</p></section>
      <section><h2 className="mb-3 text-2xl">Browser storage and booking</h2><p className="prose-body">Your browser temporarily keeps information needed to resume an unfinished upload in the same tab. Admin access uses an authentication session cookie. Booking a call opens Cal.com, which handles scheduling under its own privacy terms.</p></section>
    </div>
  </main>;
}
