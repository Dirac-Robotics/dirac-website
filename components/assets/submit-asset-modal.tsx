"use client";

import * as React from "react";
import { UploadIcon, XIcon, FileVideoIcon, ImageIcon } from "lucide-react";

import {
  UPLOAD_ACCEPT,
  formatBytes,
  kindForMime,
  maxBytesForKind,
  type MediaKind,
} from "@/lib/upload-constants";
import { uploadFile } from "@/lib/upload-client";
import { submitAssetRequest } from "@/app/actions/asset-requests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type FileItem = {
  id: string;
  name: string;
  size: number;
  kind: MediaKind;
  progress: number;
  status: "uploading" | "done" | "error";
  error?: string;
  storageKey?: string;
  mimeType?: string;
};

export function SubmitAssetModal({
  trigger,
}: {
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [phase, setPhase] = React.useState<"form" | "success">("form");

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [files, setFiles] = React.useState<FileItem[]>([]);

  const [submitting, setSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function reset() {
    setPhase("form");
    setName("");
    setEmail("");
    setTitle("");
    setDescription("");
    setFiles([]);
    setErrors({});
    setFormError(null);
    setSubmitting(false);
  }

  function onOpenChange(next: boolean) {
    // Reopening after a success starts fresh; closing mid-edit keeps input.
    if (next && phase === "success") reset();
    setOpen(next);
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    const incoming: FileItem[] = [];
    for (const file of Array.from(list)) {
      const kind = kindForMime(file.type);
      const id = crypto.randomUUID();
      if (!kind) {
        incoming.push({
          id,
          name: file.name,
          size: file.size,
          kind: "image",
          progress: 0,
          status: "error",
          error: "Unsupported file type.",
        });
        continue;
      }
      if (file.size > maxBytesForKind(kind)) {
        incoming.push({
          id,
          name: file.name,
          size: file.size,
          kind,
          progress: 0,
          status: "error",
          error: `Too large. Max ${formatBytes(maxBytesForKind(kind))}.`,
        });
        continue;
      }
      incoming.push({
        id,
        name: file.name,
        size: file.size,
        kind,
        progress: 0,
        status: "uploading",
      });
      void startUpload(id, file);
    }
    setFiles((prev) => [...prev, ...incoming]);
  }

  async function startUpload(id: string, file: File) {
    try {
      const result = await uploadFile(file, (pct) => {
        setFiles((prev) =>
          prev.map((f) => (f.id === id ? { ...f, progress: pct } : f)),
        );
      });
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id
            ? {
                ...f,
                status: "done",
                progress: 100,
                storageKey: result.storageKey,
                mimeType: result.mimeType,
              }
            : f,
        ),
      );
    } catch (err) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id
            ? {
                ...f,
                status: "error",
                error: err instanceof Error ? err.message : "Upload failed.",
              }
            : f,
        ),
      );
    }
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  const uploading = files.some((f) => f.status === "uploading");
  const doneMedia = files.filter(
    (f) => f.status === "done" && f.storageKey && f.mimeType,
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setErrors({});

    if (uploading) {
      setFormError("Wait for uploads to finish.");
      return;
    }

    setSubmitting(true);
    const res = await submitAssetRequest({
      name,
      email,
      title,
      description,
      media: doneMedia.map((f) => ({
        storageKey: f.storageKey!,
        mimeType: f.mimeType! as never,
        sizeBytes: f.size,
        kind: f.kind,
      })),
    });
    setSubmitting(false);

    if (res.ok) {
      setPhase("success");
    } else {
      setErrors(res.fieldErrors ?? {});
      setFormError(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl">
        {phase === "success" ? (
          <SuccessView email={email} onClose={() => setOpen(false)} />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Request an asset</DialogTitle>
              <DialogDescription>
                Describe what you need. Upload a photo, a video, or both. The
                community votes, and the top request gets built. If it is yours,
                you get it free.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
              <Field label="Your name" htmlFor="req-name" error={errors.name}>
                <Input
                  id="req-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                  aria-invalid={errors.name ? true : undefined}
                />
              </Field>

              <Field label="Email" htmlFor="req-email" error={errors.email}>
                <Input
                  id="req-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  aria-invalid={errors.email ? true : undefined}
                />
              </Field>

              <Field
                label="Asset title"
                htmlFor="req-title"
                error={errors.title}
              >
                <Input
                  id="req-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Robotiq 2F-85 gripper"
                  required
                  aria-invalid={errors.title ? true : undefined}
                />
              </Field>

              <Field
                label="Description"
                htmlFor="req-desc"
                error={errors.description}
                hint="Describe the object, materials, and how it should behave."
              >
                <Textarea
                  id="req-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  aria-invalid={errors.description ? true : undefined}
                />
              </Field>

              <div className="flex flex-col gap-2">
                <Label>Media</Label>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    addFiles(e.dataTransfer.files);
                  }}
                  className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border px-4 py-6 text-center transition-colors hover:border-graphite"
                >
                  <UploadIcon className="size-5 text-muted-foreground" />
                  <span className="ui-text text-[0.8125rem]">
                    Click or drop images and video
                  </span>
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  accept={UPLOAD_ACCEPT}
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />

                {files.length > 0 ? (
                  <ul className="flex flex-col gap-2">
                    {files.map((f) => (
                      <li
                        key={f.id}
                        className="flex items-center gap-3 rounded-md border border-border px-3 py-2"
                      >
                        {f.kind === "video" ? (
                          <FileVideoIcon className="size-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <ImageIcon className="size-4 shrink-0 text-muted-foreground" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="data truncate text-xs text-foreground">
                            {f.name}
                          </p>
                          {f.status === "uploading" ? (
                            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full bg-foreground transition-all"
                                style={{ width: `${f.progress}%` }}
                              />
                            </div>
                          ) : f.status === "error" ? (
                            <p className="text-[0.8125rem] text-destructive">
                              {f.error}
                            </p>
                          ) : (
                            <p className="data text-[0.65rem] text-dim">
                              {formatBytes(f.size)} · ready
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(f.id)}
                          aria-label={`Remove ${f.name}`}
                          className="rounded-sm text-muted-foreground hover:text-foreground"
                        >
                          <XIcon className="size-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              {formError ? (
                <p role="alert" className="text-[0.8125rem] text-destructive">
                  {formError}
                </p>
              ) : null}

              <Button
                type="submit"
                size="lg"
                disabled={submitting || uploading}
                className="w-full"
              >
                {submitting
                  ? "Submitting..."
                  : uploading
                    ? "Uploading..."
                    : "Submit request"}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error ? (
        <p className="ui-text text-[0.8125rem]">{hint}</p>
      ) : null}
      {error ? (
        <p role="alert" className="text-[0.8125rem] text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SuccessView({
  email,
  onClose,
}: {
  email: string;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 py-2">
      <DialogHeader>
        <DialogTitle>Request submitted</DialogTitle>
        <DialogDescription>
          Check your inbox. We sent a confirmation link to{" "}
          <span className="text-foreground">{email}</span>. Confirm your email to
          verify your account so your vote counts, and so we can reach you if your
          request wins.
        </DialogDescription>
      </DialogHeader>
      <Button size="lg" onClick={onClose} className="w-full">
        Done
      </Button>
    </div>
  );
}
