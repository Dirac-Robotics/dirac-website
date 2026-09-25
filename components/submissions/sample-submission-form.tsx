"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { SAMPLE_ACCEPT, SAMPLE_CATEGORIES, formatBytes, sampleContentType, submissionSchema, type SampleContact, type SampleLimits, type UploadTicket } from "@/lib/submissions/validation";
import { uploadSampleFile } from "@/lib/submissions/upload-client";
import { LockKeyhole, Upload } from "lucide-react";
import { ButtonLabel } from "@/components/ui/button-label";
import styles from "./samples.module.css";

type SelectedFile = { file: File; path: string };
type SavedUpload = { ticket: UploadTicket; contact: SampleContact };
const STORAGE_KEY = "dirac-private-sample-upload-v1";
async function api(path: string, body?: unknown, token?: string) {
  const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "The request could not be saved. Please retry.");
  return data;
}
export function SampleSubmissionForm({ available, limits }: { available: boolean; limits: SampleLimits }) {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("");
  const [success, setSuccess] = useState("");
  const [dragging, setDragging] = useState(false);
  const [saved, setSaved] = useState<SavedUpload | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController | null>(null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    try {
      const previous = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null") as SavedUpload | null;
      if (previous && new Date(previous.ticket.expiresAt).getTime() > Date.now()) {
        // Restore a browser-owned upload capability only after hydration.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSaved(previous);
      } else sessionStorage.removeItem(STORAGE_KEY);
    } catch { /* Private browsing may disable session storage. Current-tab retry still works. */ }
    return () => controller.current?.abort();
  }, []);
  function choose(incoming: FileList | File[]) {
    if (busy) return;
    const merged = [...files];
    for (const file of Array.from(incoming)) {
      const path = file.webkitRelativePath || file.name;
      if (path.split("/").some((part) => part.startsWith("."))) continue;
      if (!sampleContentType(file.name)) { setError(`“${file.name}” is not a supported format. Remove it from your selection or package your dataset as a ZIP.`); return; }
      if (file.size === 0 || file.size > limits.maxFileBytes) { setError(`“${file.name}” must contain data and be no larger than ${formatBytes(limits.maxFileBytes)}.`); return; }
      const existing = merged.findIndex((item) => item.path === path);
      if (existing >= 0) merged[existing] = { file, path }; else merged.push({ file, path });
    }
    if (merged.length > limits.maxFiles || merged.reduce((sum, item) => sum + item.file.size, 0) > limits.maxTotalBytes) {
      setError(`Choose up to ${limits.maxFiles} files, totaling no more than ${formatBytes(limits.maxTotalBytes)}.`); return;
    }
    if (saved && merged.some((item) => !saved.ticket.files.some((file) => file.relativePath === item.path && file.sizeBytes === item.file.size))) {
      setError("To resume this request, choose the same files or folder, with unchanged filenames and sizes."); return;
    }
    setFiles(merged); setError("");
  }
  function remember(upload: SavedUpload) {
    setSaved(upload);
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(upload)); } catch { /* In-memory retry is still available. */ }
  }
  function startDifferentRequest() {
    if (busy) return;
    setSaved(null); setFiles([]); setError(""); setProgress(0);
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* Current-tab state is cleared regardless. */ }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!available || busy) return;
    setBusy(true); setError(""); setProgress(0);
    const abort = new AbortController(); controller.current = abort;
    try {
      let current = saved;
      if (!current) {
        const fields = new FormData(event.currentTarget);
        const parsed = submissionSchema(limits).safeParse({ name: fields.get("name"), email: fields.get("email"), company: fields.get("company"), category: fields.get("category"), description: fields.get("description"), website: fields.get("website"), files: files.map(({ file, path }) => ({ originalFilename: file.name, relativePath: path, sizeBytes: file.size })) });
        if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Please check your details.");
        setPhase("Saving your request…");
        const ticket: UploadTicket = await api("/api/samples", parsed.data);
        const { name, email, company, category, description } = parsed.data;
        current = { ticket, contact: { name, email, company, category, description } };
        remember(current);
      }
      const { ticket } = current;
      setPhase("Checking uploaded files…");
      const resumed = await api(`/api/samples/${ticket.id}/resume`, undefined, ticket.token) as { complete: boolean; files: UploadTicket["files"] };
      if (!resumed.complete) {
        const total = ticket.files.reduce((sum, file) => sum + file.sizeBytes, 0);
        let uploaded = resumed.files.filter((file) => file.uploaded).reduce((sum, file) => sum + file.sizeBytes, 0);
        for (const remote of resumed.files.filter((file) => !file.uploaded)) {
          const selected = files.find((item) => item.path === remote.relativePath && item.file.size === remote.sizeBytes);
          if (!selected) throw new Error(`Reselect “${remote.relativePath}” to resume. Files already received will be kept.`);
          setPhase(`Uploading ${selected.file.name}`);
          await uploadSampleFile(selected.file, remote.url!, sampleContentType(selected.file.name)!, abort.signal, (bytes) => setProgress(Math.min(98, Math.round((uploaded + bytes) / total * 98))));
          uploaded += selected.file.size;
        }
        if (abort.signal.aborted) throw new Error("Upload paused. Retry to finish your request.");
        setPhase("Verifying and privately saving your samples…");
        await api(`/api/samples/${ticket.id}/complete`, undefined, ticket.token);
      }
      setProgress(100); setSuccess(ticket.id); setSaved(null); setFiles([]);
      try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* no-op */ }
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Upload interrupted. Retry to finish your request."); }
    finally { setBusy(false); controller.current = null; }
  }
  if (success) return <div className={styles.success} role="status"><span className={styles.successIcon} aria-hidden="true">✓</span><h3>Your sample is in.</h3><p>Saved privately. We’ll follow up by email.</p><p className={styles.reference}>Reference: {success.slice(0, 8)}</p><button className={`${styles.secondaryButton} button-motion`} onClick={() => setSuccess("")}><ButtonLabel>Send another sample</ButtonLabel></button></div>;
  return (
    <form ref={form} onSubmit={submit} className={styles.form} aria-label="Submit robot samples">
      {!available && <div className={styles.notice} role="status"><strong>Uploads are temporarily unavailable.</strong><p>Email <a href="mailto:founders@diracrobotics.com">founders@diracrobotics.com</a> or book a call.</p></div>}
      {saved && <div className={styles.notice}><strong>You have an unfinished request.</strong><p>Reselect the same files or folder and choose Retry upload. Files already received will be kept. This request is not confirmed until verification finishes.</p>{!busy && <details className={styles.formatDetails}><summary>Need to start a different request?</summary><p>The unfinished request and any received files will remain private for the team to clean up. Starting again clears this browser’s retry link.</p><button type="button" className={styles.secondaryButton} onClick={startDifferentRequest}>Start a new request</button></details>}</div>}
      <fieldset disabled={!available || busy || !!saved} className={styles.fields} key={saved?.ticket.id ?? "new"}>
        <div className={styles.field}><label htmlFor="sample-name">Name</label><input id="sample-name" name="name" autoComplete="name" required minLength={2} maxLength={120} defaultValue={saved?.contact.name} /></div>
        <div className={styles.field}><label htmlFor="sample-email">Work email</label><input id="sample-email" name="email" type="email" autoComplete="email" placeholder="you@company.com" required maxLength={254} defaultValue={saved?.contact.email} /></div>
        <div className={styles.field}><label htmlFor="sample-company">Company</label><input id="sample-company" name="company" autoComplete="organization" required maxLength={160} defaultValue={saved?.contact.company} /></div>
        <div className={styles.field}><label htmlFor="sample-category">Data type</label><select id="sample-category" name="category" defaultValue={saved?.contact.category ?? "scene_videos"}>{Object.entries(SAMPLE_CATEGORIES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        <details className={`${styles.optionalContext} ${styles.full}`}>
          <summary>Add context <span>(optional)</span></summary>
          <div className={styles.field}><label className="sr-only" htmlFor="sample-description">About your robot or task</label><textarea id="sample-description" name="description" rows={2} maxLength={5000} placeholder="Tell us about your robot or task." defaultValue={saved?.contact.description} /></div>
        </details>
        <div className={styles.honeypot} aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      </fieldset>
      <div className={`${styles.dropzone} ${dragging ? styles.dragging : ""}`} onDragOver={(event) => { event.preventDefault(); if (available) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => {
        event.preventDefault(); setDragging(false); if (!available) return;
        if (Array.from(event.dataTransfer.items).some((item) => item.webkitGetAsEntry?.()?.isDirectory)) { setError("For folders, use Choose folder so that every file and folder path is included."); return; }
        choose(event.dataTransfer.files);
      }}>
        <Upload className={styles.uploadMark} aria-hidden="true"/><p>Drop files here</p><div className={styles.pickers}><button className="button-motion" type="button" disabled={!available || busy} onClick={() => fileInput.current?.click()}><ButtonLabel>Choose files</ButtonLabel></button><span>or</span><button className="button-motion" type="button" disabled={!available || busy} onClick={() => folderInput.current?.click()}><ButtonLabel>Choose folder</ButtonLabel></button></div>
        <input ref={fileInput} type="file" multiple accept={SAMPLE_ACCEPT} className={styles.hiddenInput} aria-label="Choose sample files" disabled={!available || busy} onChange={(event) => { if (event.target.files) choose(event.target.files); event.target.value = ""; }} />
        <input ref={folderInput} type="file" multiple {...{ webkitdirectory: "", directory: "" }} className={styles.hiddenInput} aria-label="Choose sample folder" disabled={!available || busy} onChange={(event) => { if (event.target.files) choose(event.target.files); event.target.value = ""; }} />
        <details id="sample-formats" className={styles.formatDetails}>
          <summary>Formats &amp; limits</summary>
          <p className={styles.limits}>Up to {limits.maxFiles} files · {formatBytes(limits.maxFileBytes)} each · {formatBytes(limits.maxTotalBytes)} total</p>
          <p>{SAMPLE_ACCEPT.replaceAll(",", ", ")}</p>
          <p>Uploads begin when you send. Use Choose files if folders aren’t supported.</p>
        </details>
      </div>
      {files.length > 0 && <div className={styles.fileSummary}><p>{files.length} selected · {formatBytes(files.reduce((sum, item) => sum + item.file.size, 0))}</p><ul>{files.map(({ file, path }) => <li key={path}><span title={path}>{path}<small>{formatBytes(file.size)}</small></span><button type="button" disabled={busy} aria-label={`Remove ${path}`} onClick={() => setFiles((current) => current.filter((item) => item.path !== path))}>×</button></li>)}</ul></div>}
      {busy && <div className={styles.progress} role="status"><div><span>{phase}</span><span>{progress}%</span></div><progress value={progress} max={100} aria-label="Sample upload progress" />{phase.startsWith("Uploading ") && <button type="button" onClick={() => controller.current?.abort()}>Pause upload</button>}</div>}
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button className={`${styles.primaryButton} button-motion`} type="submit" disabled={!available || busy}><ButtonLabel>{busy ? "Sending…" : saved ? "Retry upload" : "Send sample"}</ButtonLabel><span aria-hidden="true">↗</span></button>
      <p className={styles.privacy}><span><LockKeyhole size={12} aria-hidden="true"/>Private to the Dirac team.</span><a href="/privacy">Privacy</a></p>
    </form>
  );
}
