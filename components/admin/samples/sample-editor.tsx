"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SAMPLE_CATEGORIES, SAMPLE_STATUSES, formatBytes } from "@/lib/submissions/validation";
import type { SampleRequest, SampleAttachment } from "@/lib/db/schema";
import styles from "./admin-samples.module.css";

type Serialized<T> = { [K in keyof T]: T[K] extends Date ? string : T[K] extends Date | null ? string | null : T[K] };
export type SampleEditorData = { request: Omit<Serialized<SampleRequest>, "uploadTokenHash">; files: Serialized<SampleAttachment>[] };
async function call(path: string, method: string, body?: unknown) {
  const response = await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "This action could not be completed.");
  return result;
}
export function SampleEditor({ data }: { data?: SampleEditorData }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const request = data?.request;
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const result = await call(request ? `/api/admin/samples/${request.id}` : "/api/admin/samples", request ? "PATCH" : "POST", values);
      if (request) { setMessage("Changes saved."); router.refresh(); } else router.push(`/admin/samples/${result.id}`);
    } catch (failure) { setError((failure as Error).message); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!request) return;
    setBusy(true); setError("");
    try { await call(`/api/admin/samples/${request.id}`, "DELETE"); router.push("/admin/samples"); router.refresh(); }
    catch (failure) { setError((failure as Error).message); router.refresh(); }
    finally { setBusy(false); setConfirmDelete(false); }
  }
  async function access(file: Serialized<SampleAttachment>, preview: boolean) {
    setError("");
    try {
      const result = await call(`/api/admin/samples/${request!.id}/attachments/${file.id}${preview ? "?preview=1" : ""}`, "GET");
      if (preview) setPreviews((current) => ({ ...current, [file.id]: result.url }));
      else {
        const anchor = document.createElement("a"); anchor.href = result.url; anchor.rel = "noreferrer"; anchor.download = file.originalFilename; anchor.click();
      }
    } catch (failure) { setError((failure as Error).message); }
  }
  async function cleanup() {
    if (!request) return;
    setBusy(true); setError(""); setMessage("");
    try { await call(`/api/admin/samples/${request.id}`, "POST"); setMessage("Temporary upload copies removed. Completed attachments are preserved."); }
    catch (failure) { setError((failure as Error).message); }
    finally { setBusy(false); }
  }
  return <main id="content" className={styles.page}>
    <Link href="/admin/samples" className={styles.back}>← Sample inbox</Link>
    <div className={styles.top}><div><div className={styles.eyebrow}>Private / Authorized Dirac team</div><h1>{request ? request.company : "Create a request"}</h1><p>{request ? "Review samples and keep the next step clear." : "Record a conversation or a request received directly."}</p></div></div>
    {message && <p className={styles.message} role="status">{message}</p>}
    {error && <p className={`${styles.message} ${styles.error}`} role="alert">{error}</p>}
    {request?.lastError && <p className={styles.message}>{request.lastError}</p>}
    <div className={styles.editor}>
      <form onSubmit={save} className={styles.panel}>
        <h2>Request details</h2>
        <div className={styles.fields}>
          <div className={styles.field}><label htmlFor="admin-name">Name</label><input id="admin-name" name="name" required minLength={2} maxLength={120} defaultValue={request?.name} /></div>
          <div className={styles.field}><label htmlFor="admin-email">Work email</label><input id="admin-email" name="email" type="email" required maxLength={254} defaultValue={request?.email} /></div>
          <div className={styles.field}><label htmlFor="admin-company">Company name</label><input id="admin-company" name="company" required maxLength={160} defaultValue={request?.company} /></div>
          <div className={styles.field}><label htmlFor="admin-category">Category</label><select id="admin-category" name="category" defaultValue={request?.category ?? "scene_videos"}>{Object.entries(SAMPLE_CATEGORIES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
          <div className={styles.field}><label htmlFor="admin-status">Status</label><select id="admin-status" name="status" defaultValue={request?.status ?? "new"}>{Object.entries(SAMPLE_STATUSES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
          <div className={`${styles.field} ${styles.full}`}><label htmlFor="admin-description">Task / deployment description</label><textarea id="admin-description" name="description" rows={5} maxLength={5000} defaultValue={request?.description} /></div>
          <div className={`${styles.field} ${styles.full}`}><label htmlFor="admin-notes">Internal notes (private)</label><textarea id="admin-notes" name="internalNotes" rows={5} maxLength={20000} defaultValue={request?.internalNotes} /></div>
        </div>
        <div className={styles.actions}><button disabled={busy} className={styles.button}>{busy ? "Saving…" : request ? "Save changes" : "Create request"}</button></div>
      </form>
      <aside className={styles.panel}>
        <h2>Private samples</h2>
        {request ? <div className={styles.metadata}>Created: {request.createdAt.replace("T", " ").slice(0, 16)} UTC<br />Updated: {request.updatedAt.replace("T", " ").slice(0, 16)} UTC<br />Upload: {request.uploadState === "complete" ? "Complete" : request.uploadState === "uploading" ? "Incomplete" : "Deletion cleanup pending"}<br />Reference: {request.id}</div> : <p className={styles.metadata}>Manual requests are saved without attachments. Visitors can use the homepage to send samples securely.</p>}
        {data?.files.map((file) => <div className={styles.attachment} key={file.id}>
          <strong>{file.relativePath}</strong><p>{formatBytes(file.sizeBytes)} · {file.deletedAt ? "Removed" : file.uploadedAt ? "Privately stored" : "Upload not verified"}</p>
          {file.uploadedAt && !file.deletedAt && request?.uploadState !== "delete_failed" && <><button type="button" onClick={() => access(file, false)}>Download ↗</button>{file.contentType.startsWith("video/") && <button type="button" onClick={() => access(file, true)}>Preview video</button>}</>}
          {previews[file.id] && <video controls preload="metadata" src={previews[file.id]} aria-label={`Preview ${file.originalFilename}`} onError={() => { setError("The preview link may have expired or this video codec is unsupported. Refresh the preview or download the sample."); }} />}
        </div>)}
        {request && !data?.files.length && <p className={styles.metadata}>No attachments.</p>}
        {!!data?.files.length && request?.uploadState === "complete" && <div className={styles.actions}><button type="button" className={`${styles.button} ${styles.secondary}`} disabled={busy} onClick={cleanup}>Clean up temporary uploads</button><p className={styles.metadata}>Available after upload links expire. Private samples are retained.</p></div>}
        {request && <div className={styles.deletion}><h2>Delete request</h2><p>Removes this request and its own sample files. Failed storage cleanup remains visible for retry. Active upload links may delay final removal for up to 21 minutes.</p>{confirmDelete ? <><p><strong>Delete {request.company} and all attached samples?</strong></p><div className={styles.actions}><button type="button" className={`${styles.button} ${styles.danger}`} disabled={busy} onClick={remove}>Confirm deletion</button><button type="button" className={`${styles.button} ${styles.secondary}`} disabled={busy} onClick={() => setConfirmDelete(false)}>Cancel</button></div></> : <button type="button" className={`${styles.button} ${styles.secondary}`} disabled={busy} onClick={() => setConfirmDelete(true)}>{request.uploadState === "delete_failed" ? "Retry deletion" : "Delete request"}</button>}</div>}
      </aside>
    </div>
  </main>;
}
