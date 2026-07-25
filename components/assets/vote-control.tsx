"use client";

import { ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Single upvote control (Product Hunt style). Presentational and controlled:
 * the parent Leaderboard owns score + upvoted state so it can reconcile an
 * optimistic click against the realtime poll, then passes them back down.
 */
export function UpvoteButton({
  score,
  upvoted,
  pending = false,
  onToggle,
}: {
  score: number;
  upvoted: boolean;
  pending?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={pending}
      aria-pressed={upvoted}
      aria-label={upvoted ? "Remove upvote" : "Upvote"}
      className={cn(
        "group/upvote flex h-14 w-12 shrink-0 flex-col items-center justify-center gap-1 rounded-md border outline-none transition-colors",
        "focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-60",
        upvoted
          ? "border-foreground bg-foreground/6 text-foreground"
          : "border-border text-dim hover:border-graphite hover:text-foreground",
      )}
    >
      <ChevronUp
        strokeWidth={2.5}
        className={cn(
          "size-4 transition-transform",
          upvoted ? "-translate-y-px" : "group-hover/upvote:-translate-y-0.5",
        )}
      />
      <span className="data text-sm leading-none tabular-nums">{score}</span>
    </button>
  );
}
