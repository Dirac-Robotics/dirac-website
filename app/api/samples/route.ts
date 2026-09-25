import { createSample } from "@/lib/submissions/service";
import { jsonInput, sampleJson, sampleRoute } from "@/lib/submissions/http";

export const runtime = "nodejs";
export async function POST(request: Request) {
  return sampleRoute(async () => {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    return sampleJson(await createSample(await jsonInput(request), ip), 201);
  });
}
