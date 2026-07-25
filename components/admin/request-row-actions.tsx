"use client";

import { setRequestStatus, setModeration } from "@/app/actions/admin";
import { REQUEST_STATUSES } from "@/lib/validation";

/**
 * Inline admin controls for one request row. Plain forms bound to server
 * actions; the status <select> auto-submits on change. Server re-checks admin
 * role and re-validates every input.
 */
export function RequestRowActions({
  requestId,
  status,
  moderationState,
}: {
  requestId: string;
  status: string;
  moderationState: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={setRequestStatus}>
        <input type="hidden" name="requestId" value={requestId} />
        <select
          name="status"
          defaultValue={status}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          aria-label="Change status"
          className="rounded-sm border border-input bg-transparent px-2 py-1 mono text-xs text-foreground outline-none focus-visible:border-ring"
        >
          {REQUEST_STATUSES.map((s) => (
            <option key={s} value={s} className="bg-popover">
              {s}
            </option>
          ))}
        </select>
      </form>

      <form action={setModeration}>
        <input type="hidden" name="requestId" value={requestId} />
        <input
          type="hidden"
          name="moderationState"
          value={moderationState === "flagged" ? "visible" : "flagged"}
        />
        <button
          type="submit"
          className="rounded-sm border border-border px-2 py-1 mono text-xs text-muted-foreground hover:border-destructive hover:text-destructive"
        >
          {moderationState === "flagged" ? "unflag" : "flag spam"}
        </button>
      </form>

      <form action={setModeration}>
        <input type="hidden" name="requestId" value={requestId} />
        <input
          type="hidden"
          name="moderationState"
          value={moderationState === "hidden" ? "visible" : "hidden"}
        />
        <button
          type="submit"
          className="rounded-sm border border-border px-2 py-1 mono text-xs text-muted-foreground hover:border-graphite hover:text-foreground"
        >
          {moderationState === "hidden" ? "unhide" : "hide"}
        </button>
      </form>
    </div>
  );
}
