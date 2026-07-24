import Link from "next/link";

import type { LeaderboardRow } from "@/lib/queries";
import { VoteControl } from "@/components/assets/vote-control";
import { StatusBadge } from "@/components/assets/status-badge";

/**
 * Ranked leaderboard. Server-rendered rows with an interactive VoteControl per
 * row. Media thumbnails are plain <img> from short-lived signed URLs.
 */
export function Leaderboard({
  rows,
  isAuthed,
  totalCount,
  shownCount,
}: {
  rows: LeaderboardRow[];
  isAuthed: boolean;
  totalCount: number;
  shownCount: number;
}) {
  if (rows.length === 0) {
    return (
      <div className="border border-border p-8 text-center">
        <p className="mono text-sm text-muted-foreground">
          No requests yet. Be the first to request an asset.
        </p>
      </div>
    );
  }

  return (
    <div>
      <ol className="border border-border">
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex items-center gap-4 border-b border-border px-4 py-4 last:border-b-0"
          >
            <span className="mono w-6 shrink-0 text-center text-xs text-[var(--graphite)] tabular-nums">
              {row.rank}
            </span>

            <div className="size-12 shrink-0 overflow-hidden rounded-sm border border-border bg-muted">
              {row.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={row.thumbnailUrl}
                  alt=""
                  className="size-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="mono flex size-full items-center justify-center text-[0.6rem] text-[var(--graphite)]"
                >
                  {row.title.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-serif text-base leading-tight text-foreground">
                {row.title}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="mono text-[0.68rem] text-muted-foreground">
                  by {row.requesterFirstName}
                </span>
                <StatusBadge status={row.status} />
              </div>
            </div>

            <VoteControl
              requestId={row.id}
              initialScore={row.voteScore}
              initialUserVote={row.userVote}
              isAuthed={isAuthed}
            />
          </li>
        ))}
      </ol>

      {totalCount > shownCount ? (
        <div className="mt-4 text-center">
          <Link
            href="/requests"
            className="mono text-[0.72rem] uppercase tracking-[0.16em] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            View all {totalCount} requests
          </Link>
        </div>
      ) : null}
    </div>
  );
}
