"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { castVote, type UserVote } from "@/app/actions/votes";

/**
 * Reddit / Product Hunt style vote control.
 * - Optimistic: score + arrow update immediately, reconciled with the server's
 *   authoritative score, rolled back on error.
 * - Clicking the active arrow clears the vote; the other arrow flips it.
 * - Anonymous users are sent to sign-in on first click (no optimistic change).
 */
export function VoteControl({
  requestId,
  initialScore,
  initialUserVote,
  isAuthed,
}: {
  requestId: string;
  initialScore: number;
  initialUserVote: UserVote;
  isAuthed: boolean;
}) {
  const router = useRouter();
  const [score, setScore] = React.useState(initialScore);
  const [userVote, setUserVote] = React.useState<UserVote>(initialUserVote);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const signInHref = `/signin?next=${encodeURIComponent("/")}`;

  function vote(dir: 1 | -1) {
    if (!isAuthed) {
      router.push(signInHref);
      return;
    }
    const prevScore = score;
    const prevVote = userVote;
    const nextVote: UserVote = userVote === dir ? 0 : dir;
    // Removing the old contribution, adding the new one.
    setScore(score - userVote + nextVote);
    setUserVote(nextVote);
    setError(null);

    startTransition(async () => {
      const res = await castVote({ requestId, value: dir });
      if (res.ok) {
        setScore(res.score);
        setUserVote(res.userVote);
      } else {
        setScore(prevScore);
        setUserVote(prevVote);
        if (res.needsAuth) router.push(signInHref);
        else setError(res.error);
      }
    });
  }

  const arrow = (dir: 1 | -1) => {
    const active = userVote === dir;
    const Icon = dir === 1 ? ChevronUp : ChevronDown;
    return (
      <button
        type="button"
        onClick={() => vote(dir)}
        disabled={pending}
        aria-pressed={active}
        aria-label={dir === 1 ? "Upvote" : "Downvote"}
        className={cn(
          "flex h-5 w-7 items-center justify-center rounded-sm border transition-colors outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-60",
          active
            ? "border-foreground text-foreground"
            : "border-border text-dim hover:border-graphite hover:text-foreground",
        )}
      >
        <Icon className="size-3.5" />
      </button>
    );
  };

  // Arrows and score are grouped tight so a row is no taller than it must be.
  return (
    <div className="flex shrink-0 flex-col items-center gap-0.5">
      {arrow(1)}
      <span
        className="data w-7 text-center text-sm leading-none text-foreground"
        aria-live="polite"
      >
        {score}
      </span>
      {arrow(-1)}
      {error ? (
        <span role="alert" className="sr-only">
          {error}
        </span>
      ) : null}
    </div>
  );
}
