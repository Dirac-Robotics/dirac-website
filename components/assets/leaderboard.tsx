"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import type { LeaderboardRow } from "@/lib/data/queries";
import { toggleUpvote } from "@/app/actions/votes";
import { UpvoteButton } from "@/components/assets/vote-control";

const STORAGE_PREFIX = "dirac:upvoted:";

function readUpvoted(id: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_PREFIX + id) === "1";
  } catch {
    return false;
  }
}

function writeUpvoted(id: string, value: boolean): void {
  try {
    if (value) window.localStorage.setItem(STORAGE_PREFIX + id, "1");
    else window.localStorage.removeItem(STORAGE_PREFIX + id);
  } catch {
    // Private mode / storage disabled: the vote still counts server-side, we
    // just cannot remember it, which is acceptable for a popularity signal.
  }
}

/**
 * Ranked leaderboard.
 *
 * Anonymous voting: each browser remembers which requests it upvoted in
 * localStorage. Clicks are optimistic and reconciled with the server's score.
 *
 * Realtime (home page): polls a live snapshot every few seconds and animates
 * reordering, so votes cast by other visitors appear without a refresh. On the
 * paginated /requests page realtime is off and the server rank order is kept.
 */
export function Leaderboard({
  rows: initialRows,
  totalCount,
  shownCount,
  realtime = false,
  pollLimit = 10,
  pollMs = 3000,
}: {
  rows: LeaderboardRow[];
  totalCount: number;
  shownCount: number;
  realtime?: boolean;
  pollLimit?: number;
  pollMs?: number;
}) {
  const reduce = useReducedMotion();
  const [rows, setRows] = React.useState<LeaderboardRow[]>(initialRows);
  const [upvoted, setUpvoted] = React.useState<Record<string, boolean>>({});
  const [pending, setPending] = React.useState<Record<string, boolean>>({});
  const pendingRef = React.useRef<Set<string>>(new Set());

  // Adopt fresh server rows when the payload changes (navigation, e.g.
  // /requests pagination). React-recommended render-phase adjustment instead of
  // an effect, so there is no extra commit.
  const [seenRows, setSeenRows] = React.useState(initialRows);
  if (seenRows !== initialRows) {
    setSeenRows(initialRows);
    setRows(initialRows);
  }

  // Load this browser's upvoted flags after mount. localStorage is a
  // client-only external store, so it can only be read post-hydration.
  React.useEffect(() => {
    const map: Record<string, boolean> = {};
    for (const r of initialRows) map[r.id] = readUpvoted(r.id);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from a client-only external store (localStorage) on mount
    setUpvoted(map);
  }, [initialRows]);

  // Poll the live snapshot; keep any in-flight row's optimistic score.
  React.useEffect(() => {
    if (!realtime) return;
    let alive = true;

    const tick = async () => {
      try {
        const res = await fetch(`/api/leaderboard?limit=${pollLimit}`, {
          cache: "no-store",
        });
        if (!res.ok || !alive) return;
        const data = (await res.json()) as { rows: LeaderboardRow[] };
        if (!alive) return;

        setRows((prev) => {
          const prevById = new Map(prev.map((r) => [r.id, r]));
          return data.rows.map((r) =>
            pendingRef.current.has(r.id)
              ? {
                  ...r,
                  voteScore: prevById.get(r.id)?.voteScore ?? r.voteScore,
                }
              : r,
          );
        });
        setUpvoted((u) => {
          const next = { ...u };
          for (const r of data.rows)
            if (!(r.id in next)) next[r.id] = readUpvoted(r.id);
          return next;
        });
      } catch {
        // Transient network error: the next tick will recover.
      }
    };

    const iv = setInterval(tick, pollMs);
    return () => {
      alive = false;
      clearInterval(iv);
    };
  }, [realtime, pollLimit, pollMs]);

  const setScore = React.useCallback((id: string, next: number) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, voteScore: Math.max(0, next) } : r,
      ),
    );
  }, []);

  const onToggle = React.useCallback(
    (id: string, currentScore: number) => {
      if (pendingRef.current.has(id)) return;
      const wasUp = !!upvoted[id];
      const next = !wasUp;
      const delta = next ? 1 : -1;

      // Optimistic: flip the flag and move the score immediately.
      setUpvoted((u) => ({ ...u, [id]: next }));
      writeUpvoted(id, next);
      setScore(id, currentScore + delta);
      pendingRef.current.add(id);
      setPending((p) => ({ ...p, [id]: true }));

      void (async () => {
        const res = await toggleUpvote({ requestId: id, upvote: next });
        pendingRef.current.delete(id);
        setPending((p) => ({ ...p, [id]: false }));
        if (res.ok) {
          setScore(id, res.score);
        } else {
          // Roll back the flag and the optimistic delta.
          setUpvoted((u) => ({ ...u, [id]: wasUp }));
          writeUpvoted(id, wasUp);
          setScore(id, currentScore);
        }
      })();
    },
    [upvoted, setScore],
  );

  // On the realtime board, rank follows live score order. On the paginated
  // page the server order (and its offset ranks) is authoritative.
  const ordered = React.useMemo(() => {
    if (!realtime) return rows;
    return [...rows]
      .sort((a, b) => b.voteScore - a.voteScore)
      .map((r, i) => ({ ...r, rank: i + 1 }));
  }, [rows, realtime]);

  if (ordered.length === 0) {
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
      {/* Opaque: this panel sits over the hero on the home page. */}
      <motion.ol
        layout={!reduce}
        className="panel-solid overflow-hidden border border-border"
      >
        <AnimatePresence initial={false}>
          {ordered.map((row) => (
            <motion.li
              key={row.id}
              layout={!reduce}
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                layout: { type: "spring", stiffness: 480, damping: 42 },
                opacity: { duration: 0.2 },
              }}
              className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
            >
              <span className="data w-6 shrink-0 text-center text-xs text-dim tabular-nums">
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
              </div>

              <UpvoteButton
                score={row.voteScore}
                upvoted={!!upvoted[row.id]}
                pending={!!pending[row.id]}
                onToggle={() => onToggle(row.id, row.voteScore)}
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ol>

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
