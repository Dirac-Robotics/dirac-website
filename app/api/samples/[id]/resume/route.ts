import { resumeSample } from "@/lib/submissions/service";
import { sameOrigin, sampleJson, sampleRoute, uploadToken, uuid } from "@/lib/submissions/http";
export const runtime = "nodejs";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return sampleRoute(async () => {
    sameOrigin(request);
    return sampleJson(await resumeSample(uuid((await context.params).id), uploadToken(request)));
  });
}
