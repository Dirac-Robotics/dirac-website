import { desc } from "drizzle-orm";

import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/session";

/** CSV export of all leads. Admin-only, checked on the server. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  const rows = await db.select().from(leads).orderBy(desc(leads.createdAt));

  const header = [
    "id",
    "created_at",
    "name",
    "email",
    "company",
    "interest",
    "source_page",
    "message",
  ];
  const csv = [
    header.join(","),
    ...rows.map((r) =>
      [
        r.id,
        r.createdAt.toISOString(),
        r.name,
        r.email,
        r.company ?? "",
        r.interest,
        r.sourcePage ?? "",
        r.message ?? "",
      ]
        .map(csvCell)
        .join(","),
    ),
  ].join("\r\n");

  const filename = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}

/** RFC-4180 quoting: wrap in quotes, double internal quotes. */
function csvCell(value: string): string {
  const s = String(value);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
