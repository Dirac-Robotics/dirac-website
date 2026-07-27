import type { Metadata } from "next";

import { socialMetadata } from "@/lib/config/site";
import { PageHeader } from "@/components/marketing/page-header";
import { NodeMesh } from "@/components/marketing/node-mesh";
import { ProseBlocks } from "@/components/marketing/prose-blocks";
import { CtaSection } from "@/components/marketing/cta-section";

const DESCRIPTION =
  "Specificity is the unlock for robot deployment. Dirac is the infrastructure company that makes it cheap: reconstruct the site, evaluate the policy against it, keep both current as the site moves.";

export const metadata: Metadata = {
  title: "About",
  alternates: { canonical: "/about" },
  description: DESCRIPTION,
  ...socialMetadata({
    title: "About · Dirac Robotics",
    description: DESCRIPTION,
    path: "/about",
  }),
};

const BLOCKS = [
  "The industry is optimizing for coverage. Bigger general models, bigger asset libraries, headline counts in the hundreds of thousands. It is an impressive number to put on a slide.",
  "But nobody deploys a headline count. Deployment happens in one building, with one robot, one set of objects, and one set of tasks that has to work on Tuesday morning. Generality is a research goal. Specificity is what ships.",
  "We think that is the actual unlock. A robot works when the software knows this robot, this room, these objects, and this task, precisely. Not approximately, and not on average across a benchmark. The reason deployments stall is almost never ambition. It is that nobody can produce that specificity fast enough or cheaply enough to be worth it.",
  "So we build the infrastructure that makes it cheap. Reconstruct the site. Evaluate the policy against it. Keep both current as the site moves. Three products, one loop, each one existing because the deployment needs it.",
  "We are an infrastructure company. We do not deploy your robot and we do not sell you a library to adapt. We build the specific thing you need, for the place you need it, and we keep it true as that place changes.",
];

export default function AboutPage() {
  return (
    <main id="content" className="relative flex-1">
      <section className="relative isolate overflow-hidden mx-auto max-w-6xl px-6 py-16 md:py-24">
        <NodeMesh className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-1/2 lg:block" />
        <PageHeader
          eyebrow="About"
          headline="Specificity is the unlock. We build the infrastructure for it."
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
            Two founders out of CMU, Microsoft, and frontier AI research labs.
            Divyansh shipped AI products at GitHub Copilot and M365 and has
            founded three companies before this one. Harsha has spent nine years
            in deep learning, from autonomous vehicle perception to
            brain-inspired research on cognition and causal learning.
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
