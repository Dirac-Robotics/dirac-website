import type { Metadata } from "next";

import { PageHeader } from "@/components/marketing/page-header";
import { NodeMesh } from "@/components/marketing/node-mesh";
import { ProseBlocks } from "@/components/marketing/prose-blocks";
import { CtaSection } from "@/components/marketing/cta-section";

export const metadata: Metadata = {
  title: "About",
  description:
    "A deployment company that happens to build simulation. Reconstruct the site, evaluate the policy against it, keep both current as the site moves.",
};

const BLOCKS = [
  "The industry is optimizing for coverage. Bigger general models, bigger asset libraries, headline counts in the hundreds of thousands. It is an impressive number to put on a slide.",
  "But nobody deploys a headline count. Deployment happens in one building, with one robot, one set of objects, and one set of tasks that has to work on Tuesday morning. Generality is a research goal. Specificity is what ships.",
  "So we work backwards from the deployment. If a robot has to work in your building, then the scene has to be your building, the physics has to be measured rather than guessed, the policy has to be tested where it will actually run, and all of it has to survive the site changing next month.",
  "That is the whole company. Reconstruct the site. Evaluate the policy against it. Keep both current as the site moves. Three products, one loop, each one existing because the deployment needs it.",
  "We build this on demand, per deployment. Not a library you buy and then adapt. The specific thing you need, for the place you need it.",
];

export default function AboutPage() {
  return (
    <main id="content" className="relative flex-1">
      <section className="relative isolate overflow-hidden mx-auto max-w-6xl px-6 py-16 md:py-24">
        <NodeMesh className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-1/2 lg:block" />
        <PageHeader
          eyebrow="About"
          headline="We are a deployment company that happens to build simulation."
        />
        <div className="mt-12">
          <ProseBlocks blocks={BLOCKS} spacing="wide" />
        </div>

        {/*
          About has no spec strip. The team block takes that slot: two lines of
          prose, no grid and no cells, matching the Assets page treatment.
        */}
        <div className="mt-14">
          <div className="eyebrow mb-4">The team</div>
          <p className="prose-body">
            Engineers from CMU and Microsoft, with backgrounds in deep learning
            research and autonomous vehicle software. Founders who have shipped
            before.
          </p>
        </div>
      </section>

      <CtaSection
        headline="Tell us about your deployment."
        line="We will tell you honestly whether we can help."
        interest="other"
        sourcePage="/about"
      />
    </main>
  );
}
