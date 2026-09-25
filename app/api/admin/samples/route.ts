import { listSamples, saveAdminSample } from "@/lib/submissions/service";
import { adminAccess, jsonInput, sampleJson, sampleRoute } from "@/lib/submissions/http";
export const runtime = "nodejs";
export async function GET(request: Request) {
  return sampleRoute(async () => {
    await adminAccess(request);
    const query = new URL(request.url).searchParams;
    return sampleJson(await listSamples(query.get("status") ?? "all", query.get("sort") ?? "newest", query.get("uploads") ?? "all"));
  });
}
export async function POST(request: Request) {
  return sampleRoute(async () => {
    await adminAccess(request);
    return sampleJson(await saveAdminSample(await jsonInput(request)), 201);
  });
}
