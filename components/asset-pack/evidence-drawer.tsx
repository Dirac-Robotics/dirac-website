import { ChevronDown } from "lucide-react";

import type { EvidenceValue } from "@/lib/asset-pack/types";
import { ProvenancePill } from "@/components/asset-pack/provenance-pill";

export function EvidenceDrawer({
  values,
  disclosure,
}: {
  values: EvidenceValue[];
  disclosure: string;
}) {
  return (
    <details className="group border border-border bg-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
        <span className="data text-[0.67rem] uppercase text-ash">
          Evidence and assumptions
        </span>
        <ChevronDown className="size-4 text-dim transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-border p-4">
        <p className="prose-body max-w-none text-sm">{disclosure}</p>
        <dl className="mt-5 grid gap-px bg-border sm:grid-cols-2">
          {values.map((item) => (
            <div
              key={`${item.label}-${item.value}`}
              className="grid gap-2 bg-background p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <dt className="label">{item.label}</dt>
                <ProvenancePill provenance={item.provenance} />
              </div>
              <dd className="data text-sm text-foreground">{item.value}</dd>
              {item.uncertainty ? (
                <span className="ui-text text-xs">{item.uncertainty}</span>
              ) : null}
            </div>
          ))}
        </dl>
      </div>
    </details>
  );
}
