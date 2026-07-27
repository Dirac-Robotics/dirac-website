"use client";

import {
  ArrowLeft,
  ArrowUpRight,
  Box,
  Download,
  FileCode2,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { AssetViewer } from "@/components/asset-pack/asset-viewer";
import { DownloadGate } from "@/components/asset-pack/download-gate";
import { EvidenceDrawer } from "@/components/asset-pack/evidence-drawer";
import { PhysicsProof } from "@/components/asset-pack/physics-proof";
import { Button } from "@/components/ui/button";
import { recordAssetPackEvent } from "@/lib/asset-pack/analytics";
import type { AssetRecord } from "@/lib/asset-pack/types";

type Tab = "preview" | "specifications" | "files" | "proof";

export function AssetDetail({
  asset,
  termsVersion,
  downloadsEnabled,
  contactUrl,
  onBack,
}: {
  asset: AssetRecord;
  termsVersion: string;
  downloadsEnabled: boolean;
  contactUrl: string;
  onBack: () => void;
}) {
  const [tab, setTab] = React.useState<Tab>("preview");
  const [gate, setGate] = React.useState(false);

  const tabClass =
    "data border border-transparent px-3 py-2 text-[0.64rem] uppercase text-dim transition-colors hover:text-foreground aria-[current=page]:border-border aria-[current=page]:bg-card aria-[current=page]:text-foreground";

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-10 md:py-16">
      <header className="flex items-center justify-between gap-5">
        <button
          className="inline-flex items-center gap-2 text-sm text-dim transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          onClick={onBack}
        >
          <ArrowLeft className="size-4" />
          Asset pack
        </button>
        <div className="flex items-center gap-4">
          <span className="data hidden text-[0.62rem] uppercase text-dim sm:inline">
            {asset.version}
          </span>
          {downloadsEnabled ? (
            <Button
              size="lg"
              className="h-11"
              onClick={() => {
                setGate(true);
                recordAssetPackEvent("download_gate_open", {
                  assetSlug: asset.slug,
                  bundleId: asset.bundleId,
                });
              }}
            >
              <Download className="size-4" />
              Download
            </Button>
          ) : (
            <Button asChild size="lg" className="h-11">
              <Link href={contactUrl}>
                Request access
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          )}
        </div>
      </header>

      <div className="grid gap-8 py-12 md:grid-cols-[minmax(0,1fr)_18rem] md:items-end md:py-16">
        <div>
          <div className="eyebrow mb-4">
            {asset.evidenceTier.replaceAll("-", " ")}
          </div>
          <h1 className="text-5xl leading-none tracking-[-0.035em] text-foreground sm:text-7xl lg:text-8xl">
            {asset.title}
          </h1>
          <p className="prose-lead mt-6">{asset.description}</p>
        </div>
        <div className="data grid gap-3 border-y border-border py-4 text-[0.65rem] uppercase text-dim">
          <span className="inline-flex items-center gap-2">
            <Box className="size-3.5" />
            {asset.dimensions}
          </span>
          <span>{asset.mass}</span>
          <span>Meters · right-handed</span>
        </div>
      </div>

      <nav
        className="mb-3 flex w-full gap-1 overflow-x-auto border-b border-border"
        aria-label="Asset information"
      >
        {(
          [
            ["preview", "Preview"],
            ["specifications", "Specifications"],
            ["files", "Files"],
            ["proof", "Physics proof"],
          ] as [Tab, string][]
        ).map(([name, label]) => (
          <button
            className={tabClass}
            key={name}
            aria-current={tab === name ? "page" : undefined}
            onClick={() => setTab(name)}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "preview" ? (
        <div className="border border-border bg-card p-2">
          <AssetViewer asset={asset} />
          <div className="grid gap-2 border-t border-border p-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
            <span className="label">Browser preview</span>
            <p className="text-sm leading-6 text-body">
              GLB carries appearance in glTF Y-up. The download&apos;s canonical
              physics stage is meter-scaled, right-handed OpenUSD with Z-up.
            </p>
          </div>
        </div>
      ) : null}

      {tab === "specifications" ? (
        <div className="grid gap-8 border border-border bg-card p-5 md:grid-cols-2 md:p-8">
          <div>
            <h2 className="text-2xl text-foreground">Physical record</h2>
            <p className="mt-3 text-sm leading-6 text-body">
              Values remain useful only when their provenance is visible. This
              record separates observations, fitted values, and assumptions.
            </p>
            <div className="mt-6">
              <EvidenceDrawer
                values={asset.evidence}
                disclosure={asset.disclosure}
              />
            </div>
          </div>
          <div>
            <h2 className="text-2xl text-foreground">Compatibility</h2>
            <div className="mt-6 grid gap-2">
              {asset.compatibility.map((badge) => (
                <div
                  key={badge.label}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 border border-border bg-background p-3"
                >
                  <ShieldCheck className="mt-0.5 size-4 text-ash" />
                  <span>
                    <strong className="block text-sm font-medium text-foreground">
                      {badge.label}
                    </strong>
                    <small className="mt-1 block leading-5 text-dim">
                      {badge.detail}
                    </small>
                  </span>
                  <em className="data text-[0.56rem] uppercase not-italic text-dim">
                    {badge.status.replaceAll("-", " ")}
                  </em>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {tab === "files" ? (
        <div className="grid gap-8 border border-border bg-card p-5 md:p-8">
          {!downloadsEnabled ? (
            <p className="border border-border bg-background p-4 text-sm leading-6 text-body">
              These file records describe the upcoming evaluation bundles.
              Public downloads are not enabled in this showcase.
            </p>
          ) : null}
          <div className="grid gap-px bg-border sm:grid-cols-2">
            <div className="bg-background p-5">
              <span className="data border border-border px-2 py-1 text-[0.62rem] text-ash">
                GLB
              </span>
              <h2 className="mt-4 text-xl text-foreground">Appearance</h2>
              <p className="mt-2 text-sm leading-6 text-body">
                Compact browser and DCC preview with PBR materials. Physics
                metadata is not canonical here.
              </p>
            </div>
            <div className="bg-background p-5">
              <span className="data border border-border px-2 py-1 text-[0.62rem] text-ash">
                USD
              </span>
              <h2 className="mt-4 text-xl text-foreground">Simulation</h2>
              <p className="mt-2 text-sm leading-6 text-body">
                Canonical geometry, mass properties, colliders, materials, and
                evidence metadata.
              </p>
            </div>
          </div>

          <div className="divide-y divide-border border border-border">
            {asset.files.map((file) => (
              <div
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 bg-background p-3 sm:grid-cols-[auto_minmax(0,1fr)_5rem_6rem]"
                key={`${file.label}-${file.format}`}
              >
                <FileCode2 className="size-4 text-ash" />
                <span>
                  <strong className="block text-sm font-medium text-foreground">
                    {file.label}
                  </strong>
                  <small className="block leading-5 text-dim">{file.role}</small>
                </span>
                <em className="data text-[0.6rem] uppercase not-italic text-dim">
                  {file.format}
                </em>
                <b className="data hidden text-right text-[0.6rem] font-normal text-dim sm:block">
                  {file.size}
                </b>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {tab === "proof" ? <PhysicsProof asset={asset} /> : null}

      {gate && downloadsEnabled ? (
        <DownloadGate
          bundleId={asset.bundleId}
          termsVersion={termsVersion}
          onClose={() => setGate(false)}
        />
      ) : null}
    </section>
  );
}
