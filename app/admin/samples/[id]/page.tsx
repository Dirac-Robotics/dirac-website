import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { getSample } from "@/lib/submissions/service";
import { SampleError } from "@/lib/submissions/errors";
import { uuid } from "@/lib/submissions/http";
import { SampleEditor, type SampleEditorData } from "@/components/admin/samples/sample-editor";
import styles from "@/components/admin/samples/admin-samples.module.css";
export const dynamic = "force-dynamic";
export const metadata = { title: "Sample request", robots: { index: false, follow: false } };
export default async function SamplePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin(`/admin/samples/${id}`);
  let sample;
  try { sample = await getSample(uuid(id)); }
  catch (error) {
    if (error instanceof SampleError && error.status === 404) notFound();
    return <main id="content" className={styles.page}><Link href="/admin/samples" className={styles.back}>← Sample inbox</Link><div className={styles.message}>This request could not be loaded. Please try again when the database is available.</div></main>;
  }
  // Upload capability hashes remain server-side, even for the admin UI.
  const data = JSON.parse(JSON.stringify(sample, (key, value) => key === "uploadTokenHash" ? undefined : value)) as SampleEditorData;
  return <SampleEditor data={data} />;
}
