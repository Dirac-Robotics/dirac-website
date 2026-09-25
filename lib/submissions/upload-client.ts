"use client";
// Azure block uploads keep videos off Next.js request bodies. A failed block is
// retried up to three times. A later request retries only incomplete files.
function put(url: string, body: Blob | string, headers: Record<string, string>, signal: AbortSignal, progress?: (loaded: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const abort = () => xhr.abort();
    if (signal.aborted) return reject(new Error("Upload paused. Your request is saved but has not been submitted."));
    xhr.open("PUT", url);
    xhr.timeout = 120000;
    Object.entries(headers).forEach(([key, value]) => xhr.setRequestHeader(key, value));
    xhr.setRequestHeader("x-ms-version", "2023-11-03");
    xhr.upload.onprogress = (event) => progress?.(event.loaded);
    const finish = () => signal.removeEventListener("abort", abort);
    xhr.onload = () => { finish(); if (xhr.status >= 200 && xhr.status < 300) resolve(); else reject(new Error("Storage could not accept this upload. Check your connection and retry.")); };
    xhr.onerror = () => { finish(); reject(new Error("Upload connection failed. Check your connection and retry.")); };
    xhr.ontimeout = () => { finish(); reject(new Error("Upload timed out. Retry to continue.")); };
    xhr.onabort = () => { finish(); reject(new Error("Upload paused. Your request is saved but has not been submitted.")); };
    signal.addEventListener("abort", abort, { once: true });
    xhr.send(body);
  });
}
export async function uploadSampleFile(file: File, signedUrl: string, contentType: string, signal: AbortSignal, onProgress: (bytes: number) => void) {
  const blockBytes = 8 * 1024 ** 2;
  const blocks: string[] = [];
  for (let start = 0; start < file.size; start += blockBytes) {
    const id = btoa(String(blocks.length).padStart(8, "0"));
    const block = file.slice(start, Math.min(file.size, start + blockBytes));
    const url = new URL(signedUrl);
    url.searchParams.set("comp", "block");
    url.searchParams.set("blockid", id);
    for (let attempt = 0; ; attempt++) {
      try { await put(url.toString(), block, {}, signal, (bytes) => onProgress(start + bytes)); break; }
      catch (error) {
        if (signal.aborted || attempt >= 2) throw error;
        await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 600));
      }
    }
    blocks.push(id);
  }
  const url = new URL(signedUrl);
  url.searchParams.set("comp", "blocklist");
  await put(url.toString(), `<?xml version="1.0" encoding="utf-8"?><BlockList>${blocks.map((id) => `<Latest>${id}</Latest>`).join("")}</BlockList>`, {
    "Content-Type": "application/xml", "x-ms-blob-content-type": contentType,
  }, signal);
  onProgress(file.size);
}
