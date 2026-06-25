import { cn } from "@/lib/utils";

const SIZES = {
  sm: "text-[1.125rem]",
  md: "text-[1.5rem]",
} as const;

type WordmarkSize = keyof typeof SIZES;

export function Wordmark({
  size = "sm",
  className,
}: {
  size?: WordmarkSize;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block font-serif leading-none tracking-[-0.01em] text-foreground",
        SIZES[size],
        className,
      )}
    >
      dirac<span style={{ color: "var(--white)" }}>.</span>
    </span>
  );
}
