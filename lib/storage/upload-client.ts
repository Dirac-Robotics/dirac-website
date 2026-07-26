/**
 * Client-side direct-to-storage upload. Two steps:
 *   1. ask our server for a presigned URL (server validates mime + size)
 *   2. PUT the file straight to object storage, reporting progress via XHR
 * The file never passes through the app server.
 */
import type { MediaKind } from "@/lib/storage/upload-constants";

export type UploadResult = {
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  kind: MediaKind;
};

export class UploadError extends Error {}

export async function uploadFile(
  file: File,
  onProgress: (pct: number) => void,
): Promise<UploadResult> {
  const presignRes = await fetch("/api/uploads/presign", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    }),
  });

  if (!presignRes.ok) {
    const body = await presignRes.json().catch(() => ({}));
    throw new UploadError(body.error ?? "Could not start the upload.");
  }

  const { uploadUrl, storageKey, kind } = (await presignRes.json()) as {
    uploadUrl: string;
    storageKey: string;
    kind: MediaKind;
  };

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("x-ms-blob-type", "BlockBlob");
    xhr.setRequestHeader("content-type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable)
        onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new UploadError(`Upload failed (${xhr.status}).`));
    };
    xhr.onerror = () => reject(new UploadError("Network error during upload."));
    xhr.onabort = () => reject(new UploadError("Upload cancelled."));
    xhr.send(file);
  });

  onProgress(100);
  return { storageKey, mimeType: file.type, sizeBytes: file.size, kind };
}
