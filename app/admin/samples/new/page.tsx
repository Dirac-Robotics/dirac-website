import { requireAdmin } from "@/lib/auth/session";
import { SampleEditor } from "@/components/admin/samples/sample-editor";
export const dynamic = "force-dynamic";
export const metadata = { title: "Create sample request", robots: { index: false, follow: false } };
export default async function NewSamplePage() {
  await requireAdmin("/admin/samples/new");
  return <SampleEditor />;
}
