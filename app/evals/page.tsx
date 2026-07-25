import type { Metadata } from "next";

import { PageHeader } from "@/components/marketing/page-header";
import { NodeMesh } from "@/components/marketing/node-mesh";
import { ProseBlocks } from "@/components/marketing/prose-blocks";
import { SpecStrip, type Spec } from "@/components/marketing/spec-strip";
import { CtaSection } from "@/components/marketing/cta-section";

export const metadata: Metadata = {
  title: "Evals",
  description:
    "Regression testing for robots. We build an evaluation suite for your deployment and run it before the robot touches your floor.",
};

const BLOCKS = [
  "A policy that works in the lab is not a policy that works in your building. You usually find that out on day one, on site, with a customer watching and a real cost attached.",
  "We turn your reconstructed scene into an evaluation suite. Real tasks pulled from your actual workflow. Randomization across the things that genuinely vary on a floor: lighting, object placement, clutter, wear, human interference. Hundreds of runs before a single real one.",
  "What comes back is not a score. It is a pass rate per task plus the specific conditions where the policy failed, with the scene state that caused each failure. If the robot cannot do the job, you learn it in simulation, on your schedule, instead of on site.",
  "Then every policy update reruns the suite. If a change breaks a task that used to pass, you see it before it ships. That is what regression testing has always meant, and it is overdue in robotics.",
];

const SPECS: Spec[] = [
  { label: "Tasks", value: "Built from your workflow" },
  { label: "Randomization", value: "Lighting, placement, clutter, wear" },
  { label: "Output", value: "Pass rate plus failure conditions" },
  { label: "Rerun", value: "On every policy update" },
];

export default function EvalsPage() {
  return (
    <main id="content" className="relative flex-1">
      <section className="relative isolate overflow-hidden mx-auto max-w-6xl px-6 py-16 md:py-24">
        <NodeMesh className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-1/2 lg:block" />
        <PageHeader
          eyebrow="Evals"
          headline="Regression testing for robots."
          standfirst="Nobody ships software without a test suite. Most robots ship on a demo and a hope. We build the suite for your deployment and run it before the robot touches your floor."
        />
        <div className="mt-12">
          <ProseBlocks blocks={BLOCKS} />
        </div>
        <div className="mt-12">
          <SpecStrip specs={SPECS} />
        </div>
      </section>

      <CtaSection
        headline="Find out if your robot is ready."
        line="Tell us the site and the task. We will build the suite and show you where it breaks."
        interest="evals"
        sourcePage="/evals"
      />
    </main>
  );
}
