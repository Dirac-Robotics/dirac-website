import type { Metadata } from "next";

import { PageHeader } from "@/components/marketing/page-header";
import { NodeMesh } from "@/components/marketing/node-mesh";
import { ProseBlocks } from "@/components/marketing/prose-blocks";
import { SpecStrip, type Spec } from "@/components/marketing/spec-strip";
import { CtaSection } from "@/components/marketing/cta-section";

export const metadata: Metadata = {
  title: "Deployments",
  description:
    "A robot doing its job in your building, every day, through whatever that day brings. Validated before launch and re-validated as the site changes.",
};

const BLOCKS = [
  "Deployments rarely fail at launch. They fail in week six. The light changes with the season. Someone moves a rack. A new SKU shows up in a box the gripper has never seen. Performance degrades quietly until somebody notices the throughput number has slipped.",
  "We combine the reconstructed scene and the evaluation suite into a single loop around your deployment. Before launch, the policy is validated against your actual site rather than a benchmark. You go live knowing the pass rate and knowing the failure modes.",
  "After launch, when the site changes, we re-capture what changed, update the scene, rerun the suite, and tell you whether the policy still holds. If it does not, you get the specific conditions that broke it.",
  "The environment is allowed to change, because the simulation changes with it. That is the difference between a deployment that holds and one that decays while everyone assumes it is fine.",
];

const SPECS: Spec[] = [
  { label: "Before launch", value: "Validated against your site" },
  { label: "At launch", value: "Known pass rate, known failure modes" },
  { label: "After launch", value: "Re-capture, rerun, re-validate" },
  { label: "When it moves", value: "The sim moves with it" },
];

export default function DeploymentsPage() {
  return (
    <main id="content" className="relative flex-1">
      <section className="relative isolate overflow-hidden mx-auto max-w-6xl px-6 py-16 md:py-24">
        <NodeMesh className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-1/2 lg:block" />
        <PageHeader
          eyebrow="Deployments"
          headline="The deployment was always the point."
          standfirst="A scene is not a product. A test suite is not a product. A robot doing its job in your building, every day, through whatever that day brings, is the product."
        />
        <div className="mt-12">
          <ProseBlocks blocks={BLOCKS} />
        </div>
        <div className="mt-12">
          <SpecStrip specs={SPECS} />
        </div>
      </section>

      <CtaSection
        headline="Tell us what you are deploying."
        line="The robot, the site, the task. We will tell you what it takes to keep it working."
        interest="other"
        sourcePage="/deployments"
      />
    </main>
  );
}
