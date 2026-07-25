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
      <div className="panel-solid border border-border p-8 text-center">
        <p className="ui-text">
          No requests yet. Be the first to request an asset.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Opaque: this panel sits over the hero video on the home page. */}
      <ol className="panel-solid border border-border">
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
          >
            <span className="data w-6 shrink-0 text-center text-xs text-dim">
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
                  className="data flex size-full items-center justify-center text-[0.6rem] text-dim"
                >
                  {row.title.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-base leading-tight text-foreground">
                {row.title}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="data text-[0.68rem] text-dim">
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
            className="ui-text underline-offset-4 hover:text-foreground hover:underline"
          >
            View all {totalCount} requests
          </Link>
        </div>
      ) : null}
    </div>
  );
}
