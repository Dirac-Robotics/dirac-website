import type { Metadata } from "next";
import Link from "next/link";

import { getLeaderboard, getLeaderboardCount } from "@/lib/data/queries";
import { socialMetadata } from "@/lib/config/site";
import { Leaderboard } from "@/components/assets/leaderboard";

const DESCRIPTION =
  "TThe top 20 get built. The top 5 ship free to everyone.";

export const metadata: Metadata = {
  title: "All requests",
  alternates: { canonical: "/requests" },
  description: DESCRIPTION,
  ...socialMetadata({
    title: "All requests · Dirac Robotics",
    description: DESCRIPTION,
    path: "/requests",
  }),
};
export const dynamic = "force-dynamic";

const PER_PAGE = 25;

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);

  const [rows, total] = await Promise.all([
    getLeaderboard({
      limit: PER_PAGE,
      offset: (pageNum - 1) * PER_PAGE,
    }),
    getLeaderboardCount(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <main id="content" className="relative flex-1">
      <section className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="eyebrow mb-4">Leaderboard</div>
        <h1 className="mb-10 text-4xl leading-[1.05] tracking-[-0.02em] text-foreground md:text-5xl">
          All asset requests
        </h1>

        {/* totalCount === shownCount suppresses the inline "view all" link. */}
        <Leaderboard
          rows={rows}
          totalCount={rows.length}
          shownCount={rows.length}
        />

        {totalPages > 1 ? (
          <nav
            className="mt-8 flex items-center justify-between"
            aria-label="Pagination"
          >
            <PageLink page={pageNum - 1} disabled={pageNum <= 1}>
              Previous
            </PageLink>
            <span className="data text-xs text-dim">
              Page {pageNum} of {totalPages}
            </span>
            <PageLink page={pageNum + 1} disabled={pageNum >= totalPages}>
              Next
            </PageLink>
          </nav>
        ) : null}
      </section>
    </main>
  );
}

function PageLink({
  page,
  disabled,
  children,
}: {
  page: number;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return <span className="text-[0.8125rem] text-graphite">{children}</span>;
  }
  return (
    <Link
      href={`/requests?page=${page}`}
      className="text-[0.8125rem] text-body underline-offset-4 hover:text-foreground hover:underline"
    >
      {children}
    </Link>
  );
}
