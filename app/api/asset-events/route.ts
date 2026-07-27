import { assetEventSchema } from "@/lib/asset-pack/validation";
import { db } from "@/lib/db";
import { assetPackEvents } from "@/lib/db/schema";
import { checkRateLimit, RATE_LIMITS } from "@/lib/http/rate-limit";
import { getClientIp } from "@/lib/http/request-context";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = assetEventSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid event." }, { status: 400 });
  }

  const ip = await getClientIp();
  const rateLimit = await checkRateLimit(
    `asset-event:ip:${ip}`,
    RATE_LIMITS.assetEventPerIp.limit,
    RATE_LIMITS.assetEventPerIp.windowMs,
  );
  if (!rateLimit.ok) {
    return new Response(null, { status: 429 });
  }

  try {
    await db.insert(assetPackEvents).values(parsed.data);
  } catch {
    return new Response(null, { status: 503 });
  }
  return new Response(null, { status: 204 });
}
