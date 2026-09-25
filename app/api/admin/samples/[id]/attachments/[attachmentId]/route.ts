import { attachmentAccess } from "@/lib/submissions/service";
import { adminAccess, sampleJson, sampleRoute, uuid } from "@/lib/submissions/http";
export const runtime = "nodejs";
export async function GET(request: Request, context: { params: Promise<{ id: string; attachmentId: string }> }) {
  return sampleRoute(async () => {
    await adminAccess(request);
    const { id, attachmentId } = await context.params;
    return sampleJson(await attachmentAccess(uuid(id), uuid(attachmentId), new URL(request.url).searchParams.get("preview") === "1"));
  });
}
