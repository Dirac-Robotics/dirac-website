import type { Metadata } from "next";

import { requireAdmin } from "@/lib/session";
import {
  getAdminRequests,
  getAdminLeads,
  getVoteAudit,
} from "@/lib/admin-queries";
import { RequestRowActions } from "@/components/admin/request-row-actions";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // Server-side role check on every request. Non-admins get 404.
  await requireAdmin("/admin");

  const [requests, leads, audit] = await Promise.all([
    getAdminRequests(),
    getAdminLeads(),
    getVoteAudit(),
  ]);

  return (
    <main id="content" className="relative flex-1">
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="eyebrow mb-2">Admin</div>
        <h1 className="mb-12 font-serif text-3xl text-foreground">Triage</h1>

        {/* Asset requests */}
        <div className="mb-16">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="mono text-sm uppercase tracking-[0.14em] text-foreground">
              Asset requests
            </h2>
            <span className="mono text-xs text-muted-foreground">
              {requests.length} total
            </span>
          </div>
          <div className="overflow-x-auto border border-border">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="mono border-b border-border text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">
                  <Th>Media</Th>
                  <Th>Title</Th>
                  <Th>Requester</Th>
                  <Th>Score</Th>
                  <Th>Moderation</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border last:border-b-0 align-top"
                  >
                    <Td>
                      <div className="size-12 overflow-hidden rounded-sm border border-border bg-muted">
                        {r.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={r.thumbnailUrl}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : (
                          <span className="mono flex size-full items-center justify-center text-[0.55rem] text-[var(--graphite)]">
                            {r.mediaCount > 0 ? `${r.mediaCount}` : "none"}
                          </span>
                        )}
                      </div>
                    </Td>
                    <Td>
                      <p className="font-serif text-sm text-foreground">
                        {r.title}
                      </p>
                      <p className="mono text-[0.65rem] text-muted-foreground">
                        {r.mediaCount} file(s)
                      </p>
                    </Td>
                    <Td>
                      <p className="mono text-xs text-foreground">
                        {r.requesterName ?? "n/a"}
                      </p>
                      <p className="mono text-[0.65rem] text-muted-foreground">
                        {r.requesterEmail}
                      </p>
                    </Td>
                    <Td>
                      <span className="mono text-sm tabular-nums text-foreground">
                        {r.voteScore}
                      </span>
                    </Td>
                    <Td>
                      <span className="mono text-[0.65rem] uppercase tracking-[0.1em] text-muted-foreground">
                        {r.moderationState}
                      </span>
                    </Td>
                    <Td>
                      <RequestRowActions
                        requestId={r.id}
                        status={r.status}
                        moderationState={r.moderationState}
                      />
                    </Td>
                  </tr>
                ))}
                {requests.length === 0 ? (
                  <tr>
                    <Td className="mono text-xs text-muted-foreground">
                      No requests yet.
                    </Td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        {/* Leads */}
        <div className="mb-16">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="mono text-sm uppercase tracking-[0.14em] text-foreground">
              Leads
            </h2>
            <a
              href="/api/admin/leads/export"
              className="mono text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Export CSV
            </a>
          </div>
          <div className="overflow-x-auto border border-border">
            <table className="w-full min-w-[800px] border-collapse text-left">
              <thead>
                <tr className="mono border-b border-border text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">
                  <Th>Date</Th>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Company</Th>
                  <Th>Interest</Th>
                  <Th>Source</Th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} className="border-b border-border last:border-b-0">
                    <Td className="mono text-xs text-muted-foreground">
                      {l.createdAt.toISOString().slice(0, 10)}
                    </Td>
                    <Td className="mono text-xs text-foreground">{l.name}</Td>
                    <Td className="mono text-xs text-foreground">{l.email}</Td>
                    <Td className="mono text-xs text-muted-foreground">
                      {l.company ?? "n/a"}
                    </Td>
                    <Td className="mono text-xs text-muted-foreground">
                      {l.interest}
                    </Td>
                    <Td className="mono text-xs text-muted-foreground">
                      {l.sourcePage ?? "n/a"}
                    </Td>
                  </tr>
                ))}
                {leads.length === 0 ? (
                  <tr>
                    <Td className="mono text-xs text-muted-foreground">
                      No leads yet.
                    </Td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vote audit */}
        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="mono text-sm uppercase tracking-[0.14em] text-foreground">
              Vote audit
            </h2>
            <span className="mono text-xs text-muted-foreground">
              last {audit.length} votes
            </span>
          </div>
          <div className="overflow-x-auto border border-border">
            <table className="w-full min-w-[800px] border-collapse text-left">
              <thead>
                <tr className="mono border-b border-border text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">
                  <Th>Voted at</Th>
                  <Th>Request</Th>
                  <Th>Voter</Th>
                  <Th>Value</Th>
                  <Th>Account age</Th>
                </tr>
              </thead>
              <tbody>
                {audit.map((v, i) => (
                  <tr
                    key={i}
                    className="border-b border-border last:border-b-0"
                  >
                    <Td className="mono text-xs text-muted-foreground">
                      {v.votedAt.toISOString().replace("T", " ").slice(0, 16)}
                    </Td>
                    <Td className="mono text-xs text-foreground">
                      {v.requestTitle}
                    </Td>
                    <Td className="mono text-xs text-muted-foreground">
                      {v.voterEmail}
                    </Td>
                    <Td className="mono text-xs text-foreground">
                      {v.value > 0 ? "+1" : "-1"}
                    </Td>
                    <Td
                      className={
                        "mono text-xs " +
                        (v.accountAgeDays < 1
                          ? "text-destructive"
                          : "text-muted-foreground")
                      }
                    >
                      {v.accountAgeDays}d
                    </Td>
                  </tr>
                ))}
                {audit.length === 0 ? (
                  <tr>
                    <Td className="mono text-xs text-muted-foreground">
                      No votes yet.
                    </Td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-3 font-normal">{children}</th>;
}
function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-3 py-3 ${className}`}>{children}</td>;
}
