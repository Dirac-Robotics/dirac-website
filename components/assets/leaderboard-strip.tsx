"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { ChevronUp } from "lucide-react";

import type { LeaderboardRow } from "@/lib/data/queries";

/**
 * Horizontal leaderboard ticker for the bottom of the hero. Presentational: it
 * shows live rank, title and score in a slow marquee that teases the full,
 * interactive leaderboard section below. Duplicated once so the loop is
 * seamless; static under prefers-reduced-motion.
 */
export function LeaderboardStrip({
  rows,
  durationSec = 32,
}: {
  rows: LeaderboardRow[];
  durationSec?: number;
}) {
  const reduce = useReducedMotion();
  if (rows.length === 0) return null;

  const items = rows.map((r, i) => ({ ...r, rank: i + 1 }));
  const loop = [...items, ...items];

  return (
    <a
      href="#leaderboard"
      aria-label="Jump to the full leaderboard"
      className="panel-solid group block w-full overflow-hidden border-t border-border"
    >
      <motion.ul
        className="flex w-max items-center py-3.5"
        animate={reduce ? undefined : { x: ["0%", "-50%"] }}
        transition={
          reduce
            ? undefined
            : { duration: durationSec, ease: "linear", repeat: Infinity }
        }
      >
        {loop.map((r, i) => (
          <li
            key={`${r.id}-${i}`}
            className="flex items-center gap-2.5 whitespace-nowrap px-6"
          >
            <span className="data text-[0.7rem] text-dim tabular-nums">
              {String(r.rank).padStart(2, "0")}
            </span>
            <span className="text-sm text-foreground">{r.title}</span>
            <span className="inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5">
              <ChevronUp className="size-3 text-dim" strokeWidth={2.5} />
              <span className="data text-xs text-foreground tabular-nums">
                {r.voteScore}
              </span>
            </span>
          </li>
        ))}
      </motion.ul>
    </a>
  );
}
