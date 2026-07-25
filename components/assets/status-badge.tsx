import { Badge } from "@/components/ui/badge";

const LABELS: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  accepted: "Accepted",
  building: "Building",
  shipped: "Shipped",
  rejected: "Rejected",
};

// Monochrome brand: keep variants restrained; "shipped" reads brightest.
const VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  submitted: "outline",
  under_review: "secondary",
  accepted: "secondary",
  building: "secondary",
  shipped: "default",
  rejected: "outline",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant={VARIANT[status] ?? "outline"}
      className="data text-[0.6rem] uppercase"
    >
      {LABELS[status] ?? status}
    </Badge>
  );
}
