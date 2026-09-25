import { cleanupSampleStaging, deleteSample, getSample, saveAdminSample } from "@/lib/submissions/service";
import { adminAccess, jsonInput, sampleJson, sampleRoute, uuid } from "@/lib/submissions/http";
export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) {
  return sampleRoute(async () => {
    await adminAccess(request);
    const sample = await getSample(uuid((await context.params).id));
    return sampleJson(JSON.parse(JSON.stringify(sample, (key, value) => key === "uploadTokenHash" ? undefined : value)));
  });
}
export async function PATCH(request: Request, context: Context) {
  return sampleRoute(async () => {
    await adminAccess(request);
    return sampleJson(await saveAdminSample(await jsonInput(request), uuid((await context.params).id)));
  });
}
export async function DELETE(request: Request, context: Context) {
  return sampleRoute(async () => {
    await adminAccess(request);
    const result = await deleteSample(uuid((await context.params).id));
    return sampleJson(result, result.deleted ? 200 : 409);
  });
}
export async function POST(request: Request, context: Context) {
  return sampleRoute(async () => { await adminAccess(request); return sampleJson(await cleanupSampleStaging(uuid((await context.params).id))); });
}
