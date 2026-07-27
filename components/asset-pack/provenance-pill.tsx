import type { Provenance } from "@/lib/asset-pack/types";
import { cn } from "@/lib/utils";

const LABELS: Record<Provenance, string> = {
  measured: "Measured",
  fitted: "Fitted",
  "prior-driven": "Prior-driven",
  unvalidated: "Unvalidated",
};

export function ProvenancePill({
  provenance,
  className,
}: {
  provenance: Provenance;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "data inline-flex items-center border border-border px-2 py-1 text-[0.58rem] uppercase text-dim",
        provenance === "measured" && "border-ash/50 text-ash",
        provenance === "fitted" && "border-graphite text-body",
        provenance === "unvalidated" && "border-destructive/50 text-destructive",
        className,
      )}
    >
      {LABELS[provenance]}
    </span>
  );
}
