import type { Metadata } from "next";

import { socialMetadata } from "@/lib/config/site";
import { PageHeader } from "@/components/marketing/page-header";
import { NodeMesh } from "@/components/marketing/node-mesh";
import { ProseBlocks } from "@/components/marketing/prose-blocks";
import { SpecStrip, type Spec } from "@/components/marketing/spec-strip";
import { CtaSection } from "@/components/marketing/cta-section";

const DESCRIPTION =
  "Point a camera at the space where your robot will work. We send back a physics-accurate USD scene in hours, not weeks.";

export const metadata: Metadata = {
  title: "Real2Sim",
  alternates: { canonical: "/real2sim" },
  description: DESCRIPTION,
  ...socialMetadata({
    title: "Real2Sim · Dirac Robotics",
    description: DESCRIPTION,
    path: "/real2sim",
  }),
};

const BLOCKS = [
  "Robots are trained in scenes that do not exist. A generic warehouse, a generic shelf, a generic object. Then they get deployed into your building, with your lighting, your floor, your bins, and performance drops. The gap between the training scene and the deployment scene is where most deployments quietly fail.",
  "We close it by making the training scene the deployment scene. A single-camera video is enough input. We reconstruct the geometry, then the pipeline resolves the physics automatically: mass, inertia, friction, joint dynamics, each with stated confidence. It arrives as USD, ready for Isaac Sim.",
  "Geometry alone tells you what a scene looks like. It does not tell you how an object behaves when a gripper closes on it. A mug that renders correctly but slips at the wrong coefficient teaches your policy the wrong lesson. Our pipeline is validated against real hardware, so what the policy learns in simulation still holds when it meets the real object.",
];

const SPECS: Spec[] = [
  { label: "Input", value: "Single-camera video" },
  { label: "Output", value: "USD scene, Isaac Sim ready" },
  { label: "Physics", value: "Predicted automatically, confidence stated" },
  { label: "Turnaround", value: "Hours" },
];

export default function Real2SimPage() {
  return (
    <main id="content" className="relative flex-1">
      <section className="relative isolate overflow-hidden mx-auto max-w-6xl px-6 py-16 md:py-24">
        <NodeMesh className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-1/2 lg:block" />
        <PageHeader
          eyebrow="Real2Sim"
          headline="Film your site. Get a scene your robot can actually train in."
          standfirst="Point a camera at the space where your robot will work. We send back a physics-accurate USD scene in hours, not weeks."
        />
        <div className="mt-12">
          <ProseBlocks blocks={BLOCKS} />
        </div>
        <div className="mt-12">
          <SpecStrip specs={SPECS} />
        </div>
      </section>

      <CtaSection
        headline="Tell us where your robot works."
        line="Send us the site and the task. We will tell you what we can reconstruct and how fast."
        interest="real2sim"
        sourcePage="/real2sim"
      />
    </main>
  );
}
