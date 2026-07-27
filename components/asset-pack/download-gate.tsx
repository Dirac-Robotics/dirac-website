"use client";

import { Check, Download, Loader2, LockKeyhole } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { recordAssetPackEvent } from "@/lib/asset-pack/analytics";

type DownloadResponse = {
  expiresAt: string;
  downloads: { name: string; url: string }[];
};

export function DownloadGate({
  bundleId,
  termsVersion = "evaluation-beta-v1",
  onClose,
}: {
  bundleId: string;
  termsVersion?: string;
  onClose: () => void;
}) {
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<DownloadResponse | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/asset-downloads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          name: form.get("name") || undefined,
          company: form.get("company") || undefined,
          bundleId,
          termsVersion,
          termsAccepted: form.get("termsAccepted") === "on",
          marketingConsent: form.get("marketingConsent") === "on",
        }),
      });
      const body = (await response.json()) as
        | DownloadResponse
        | { error?: string };
      if (!response.ok) {
        setError(
          "error" in body && body.error
            ? body.error
            : "Could not unlock the bundle.",
        );
        return;
      }
      setResult(body as DownloadResponse);
      recordAssetPackEvent("download_unlocked", { bundleId });
    } catch {
      setError("Could not reach the download service. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        {result ? (
          <div className="grid gap-5 py-4">
            <span className="flex size-10 items-center justify-center border border-ash text-foreground">
              <Check className="size-5" />
            </span>
            <div>
              <div className="eyebrow mb-2">Bundle unlocked</div>
              <DialogTitle>Ready for your simulator.</DialogTitle>
              <DialogDescription className="mt-3">
                This private link expires at{" "}
                {new Date(result.expiresAt).toLocaleTimeString()}.
              </DialogDescription>
            </div>
            {result.downloads.map((download) => (
              <Button asChild size="lg" className="h-12" key={download.name}>
                <a href={download.url} download>
                  <Download className="size-4" />
                  {download.name}
                </a>
              </Button>
            ))}
          </div>
        ) : (
          <>
            <DialogHeader>
              <span className="mb-3 flex size-10 items-center justify-center border border-border text-ash">
                <LockKeyhole className="size-5" />
              </span>
              <div className="eyebrow">Evaluation access</div>
              <DialogTitle>Unlock the simulation bundle.</DialogTitle>
              <DialogDescription>
                Includes OpenUSD, visual GLB, Newton and OpenUSD examples,
                validation evidence, and checksums.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={submit} className="grid gap-4">
              <label className="grid gap-1.5 text-sm text-ash">
                Work email <span className="sr-only">required</span>
                <Input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm text-ash">
                  Name <span className="text-dim">optional</span>
                  <Input name="name" autoComplete="name" />
                </label>
                <label className="grid gap-1.5 text-sm text-ash">
                  Company <span className="text-dim">optional</span>
                  <Input name="company" autoComplete="organization" />
                </label>
              </div>

              <details className="border border-border bg-background p-3 text-sm text-body">
                <summary className="cursor-pointer text-ash">
                  Evaluation terms, {termsVersion}
                </summary>
                <div className="mt-3 grid gap-2 leading-6">
                  <p>
                    Use is limited to internal evaluation, testing, and
                    demonstration. Redistribution, resale, model training,
                    production deployment, and commercial asset-library use
                    require a separate written agreement.
                  </p>
                  <p>
                    Assets and physical parameters are provided as is.
                    Assumptions, uncertainty, validation limits, and source
                    provenance are part of the asset record.
                  </p>
                </div>
              </details>

              <label className="flex items-start gap-3 text-sm leading-6 text-body">
                <input
                  className="mt-1 accent-foreground"
                  name="termsAccepted"
                  type="checkbox"
                  required
                />
                <span>
                  I accept the evaluation terms.{" "}
                  <strong className="font-medium text-foreground">
                    Required
                  </strong>
                </span>
              </label>
              <label className="flex items-start gap-3 text-sm leading-6 text-body">
                <input
                  className="mt-1 accent-foreground"
                  name="marketingConsent"
                  type="checkbox"
                />
                <span>
                  Send me occasional product updates. Optional and separate
                  from bundle access.
                </span>
              </label>

              {error ? (
                <p
                  className="border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}

              <Button
                className="h-12"
                type="submit"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                Get 15-minute link
              </Button>
              <small className="leading-5 text-dim">
                Lead records are retained for up to 12 months. Email addresses
                are not stored in product analytics.
              </small>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
