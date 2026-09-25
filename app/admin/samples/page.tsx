import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { getSampleConfig } from "@/lib/submissions/config";
import { listSamples } from "@/lib/submissions/service";
import { SAMPLE_CATEGORIES, SAMPLE_STATUSES } from "@/lib/submissions/validation";
import styles from "@/components/admin/samples/admin-samples.module.css";

export const metadata: Metadata = { title: "Private sample inbox", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function SamplesInbox({ searchParams }: { searchParams: Promise<{ status?: string; sort?: string; uploads?: string }> }) {
  await requireAdmin("/admin/samples");
  const query = await searchParams;
  let unavailable = !getSampleConfig();
  let requests: Awaited<ReturnType<typeof listSamples>> = [];
  if (!unavailable) {
    try { requests = await listSamples(query.status, query.sort, query.uploads); }
    catch { unavailable = true; }
  }
  return <main id="content" className={styles.page}>
    <Link href="/admin" className={styles.back}>← All admin tools</Link>
    <div className={styles.top}><div><div className={styles.eyebrow}>Dirac / Private workspace</div><h1>Sample requests</h1><p>Incoming samples, conversations, and next steps.</p></div>{!unavailable && <Link href="/admin/samples/new" className={styles.button}>Create request +</Link>}</div>
    {unavailable ? <div className={styles.message}><strong>The private inbox is unavailable.</strong><p>Database migrations and a separate private Azure sample container must be configured. See docs/SAMPLE_REQUESTS.md for setup. No sample has been accepted by this screen.</p></div> : <>
      <form className={styles.filters}>
        <label>Status<select name="status" defaultValue={query.status ?? "all"}><option value="all">All statuses</option>{Object.entries(SAMPLE_STATUSES).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>
        <label>Uploads<select name="uploads" defaultValue={query.uploads ?? "all"}><option value="all">All requests</option><option value="incomplete">Incomplete / cleanup needed</option></select></label>
        <label>Sort<select name="sort" defaultValue={query.sort ?? "newest"}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>
        <button className={`${styles.button} ${styles.secondary}`}>Apply filters</button>
      </form>
      <p className={styles.metadata}>{requests.length} request{requests.length === 1 ? "" : "s"} shown (up to 200). Incomplete uploads stay visible for follow-up and cleanup.</p>
      <div className={styles.list}>{requests.map((request) => <Link className={styles.listItem} href={`/admin/samples/${request.id}`} key={request.id}>
        <div><h2>{request.company}</h2><p>{request.name} · {request.email}</p></div>
        <div><p>{SAMPLE_CATEGORIES[request.category as keyof typeof SAMPLE_CATEGORIES]}</p><p>{request.count} file{request.count === 1 ? "" : "s"} · {request.createdAt.toISOString().slice(0, 10)}</p></div>
        <div><span className={styles.status}>{SAMPLE_STATUSES[request.status]}</span><p className={request.uploadState === "complete" ? "" : styles.warning}>{request.uploadState === "complete" ? "Received" : request.uploadState === "delete_failed" ? "Cleanup needed" : "Upload incomplete"} ↗</p></div>
      </Link>)}</div>
      {!requests.length && <div className={styles.empty}>No matching requests yet.</div>}
    </>}
  </main>;
}
