import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Camera,
  CheckCircle2,
  FlaskConical,
  MapPin,
  RefreshCw,
} from "lucide-react";

import { SITE, SITE_MEDIA, socialMetadata } from "@/lib/config/site";
import { Button } from "@/components/ui/button";
import { HeroShowcase } from "@/components/assets/hero-showcase";
import { SpecStrip, type Spec } from "@/components/marketing/spec-strip";
import { CtaSection } from "@/components/marketing/cta-section";
import { Team } from "@/components/assets/team";
import { SceneExplorer } from "@/components/landing/scene-explorer";

const DESCRIPTION =
  "Dirac turns camera video of real sites and objects into physics-accurate simulation, so robots can train in the environments where they will actually work.";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  description: DESCRIPTION,
  ...socialMetadata({
    title: "Bring the real world into simulation · Dirac Robotics",
    description: DESCRIPTION,
    path: "/",
  }),
};

const REAL2SIM_SPECS: Spec[] = [
  { label: "Input", value: "Single-camera video" },
  { label: "Output", value: "USD, Isaac Sim ready" },
  { label: "Physics", value: "Predicted, confidence stated" },
  { label: "Turnaround", value: "Hours, not weeks" },
];

const WHY_DIRAC = [
  {
    icon: MapPin,
    title: "Site-specific",
    body: "Built from the actual room, objects, and operating conditions your robot will encounter.",
  },
  {
    icon: FlaskConical,
    title: "Physics-aware",
    body: "Mass, inertia, friction, and joint dynamics matter as much as geometry and appearance.",
  },
  {
    icon: CheckCircle2,
    title: "Evidence-backed",
    body: "Values carry stated confidence and are checked against real observations instead of hidden assumptions.",
  },
];

export default function HomePage() {
  return (
    <main id="content" className="relative flex-1">
      <section className="border-b border-border bg-(--void)">
        <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-6xl flex-col px-6 py-6 md:py-10">
          <Link
            href="/community-assets"
            className="group flex items-center justify-between gap-4 border border-border bg-background/65 px-4 py-3 transition-colors hover:border-graphite hover:bg-background"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="relative flex size-1.5 shrink-0">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-foreground/40" />
                <span className="relative inline-flex size-1.5 rounded-full bg-foreground" />
              </span>
              <span className="truncate text-sm text-body">
                <span className="text-foreground">
                  Community Asset Program:
                </span>{" "}
                vote on what we build next
              </span>
            </span>
            <span className="data inline-flex shrink-0 items-center gap-1.5 text-[0.65rem] uppercase text-ash">
              View the challenge
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>

          <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14 lg:py-16">
            <div>
              <div className="eyebrow mb-5">
                Simulation infrastructure for deployment teams
              </div>
              <h1 className="max-w-[11ch] text-[3.1rem] leading-[0.98] tracking-[-0.045em] text-foreground sm:text-6xl lg:text-[4.75rem]">
                Bring the real world into simulation.
              </h1>
              <p className="prose-standfirst mt-6">
                Dirac turns camera video of real sites and objects into
                physics-accurate simulation, so robots can train in the
                environments where they will actually work.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  className="h-12 gap-2 px-7 text-base font-semibold"
                >
                  <a
                    href={SITE.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Book a call
                    <ArrowRight className="size-4" />
                  </a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 gap-2 px-7 text-base"
                >
                  <a href="#real2sim">
                    See Real2Sim
                    <ArrowDown className="size-4" />
                  </a>
                </Button>
              </div>
            </div>

            <div className="overflow-hidden border border-border bg-background">
              <div className="grid grid-cols-2 border-b border-border">
                <div className="flex items-center gap-2 border-r border-border px-3 py-2.5">
                  <Camera className="size-3.5 text-dim" />
                  <span className="data text-[0.6rem] uppercase text-dim">
                    Camera video
                  </span>
                </div>
                <div className="flex items-center justify-end gap-2 px-3 py-2.5">
                  <span className="data text-[0.6rem] uppercase text-dim">
                    Physics-ready scene
                  </span>
                  <CheckCircle2 className="size-3.5 text-dim" />
                </div>
              </div>
              <div className="relative aspect-[13/5] overflow-hidden bg-(--void)">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={SITE_MEDIA.comparison}
                  alt="Real camera frames compared with the reconstructed simulation scene"
                  className="size-full object-cover"
                  fetchPriority="high"
                />
                <div
                  className="absolute inset-y-0 left-1/2 w-px bg-foreground/25"
                  aria-hidden="true"
                />
              </div>
              <ol className="grid grid-cols-4 border-t border-border">
                {["Capture", "Reconstruct", "Resolve physics", "Simulate"].map(
                  (step, index) => (
                    <li
                      key={step}
                      className={[
                        "flex min-w-0 flex-col gap-1 px-3 py-3",
                        index < 3 ? "border-r border-border" : "",
                      ].join(" ")}
                    >
                      <span className="data text-[0.55rem] text-dim">
                        0{index + 1}
                      </span>
                      <span className="truncate text-xs text-ash">{step}</span>
                    </li>
                  ),
                )}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section
        id="real2sim"
        className="scroll-mt-16 border-b border-border bg-background"
      >
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
            <div>
              <div className="eyebrow mb-4">Real2Sim</div>
              <h2 className="max-w-[12ch] text-3xl leading-[1.05] text-foreground md:text-5xl">
                Your site, rebuilt for simulation.
              </h2>
            </div>
            <div className="lg:pt-7">
              <p className="prose-lead">
                Walk the space once with a camera. Dirac reconstructs its
                geometry and resolves the physical properties that make the
                scene useful for training: scale, mass, inertia, friction, and
                joints.
              </p>
              <p className="prose-body mt-4">
                The result is a simulation-ready environment built from the
                place where the robot will actually run, instead of a generic
                stand-in assembled by hand.
              </p>
              <Link
                href="/real2sim"
                className="mt-5 inline-flex items-center gap-1.5 text-sm text-ash transition-colors hover:text-foreground"
              >
                How the pipeline works
                <ArrowUpRight className="size-4" />
              </Link>
            </div>
          </div>

          <div className="mt-10">
            <SpecStrip specs={REAL2SIM_SPECS} />
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <article className="overflow-hidden border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <div className="data text-[0.6rem] uppercase text-dim">
                    Pipeline demo
                  </div>
                  <h3 className="mt-1 text-base text-foreground">
                    From camera capture to simulation
                  </h3>
                </div>
                <span className="data text-[0.6rem] uppercase text-dim">
                  00:51
                </span>
              </div>
              <video
                className="aspect-video size-full bg-(--void) object-cover"
                controls
                playsInline
                preload="none"
                poster={SITE_MEDIA.launchPoster}
              >
                <source src={SITE_MEDIA.launchVideo} type="video/mp4" />
                Your browser does not support embedded video.
              </video>
            </article>

            <article className="overflow-hidden border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <div className="data text-[0.6rem] uppercase text-dim">
                    Reconstructed scene
                  </div>
                  <h3 className="mt-1 text-base text-foreground">
                    Inspect the delivered environment
                  </h3>
                </div>
                <span className="data text-[0.6rem] uppercase text-dim">
                  Interactive
                </span>
              </div>
              <SceneExplorer
                sceneUrl={SITE_MEDIA.scene}
                posterUrl={SITE_MEDIA.scenePoster}
              />
            </article>
          </div>
        </div>
      </section>

      <section
        id="assets"
        className="scroll-mt-16 border-b border-border bg-(--void)"
      >
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-6 py-16 md:py-24 lg:grid-cols-[0.76fr_1.24fr] lg:gap-10">
          <div>
            <div className="eyebrow mb-4">Simulation assets</div>
            <h2 className="max-w-[13ch] text-3xl leading-[1.05] text-foreground md:text-5xl">
              Objects that behave like the real thing.
            </h2>
            <p className="prose-lead mt-6">
              A mesh can look right and still teach the wrong behavior. Dirac
              assets combine photoreal geometry with mass, inertia, friction,
              joint behavior, confidence, and real-world validation.
            </p>
            <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden border border-border bg-border">
              {[
                ["Geometry", "Deployment-specific"],
                ["Physics", "Automatically resolved"],
                ["Confidence", "Stated per value"],
                ["Evidence", "Real-world validation"],
              ].map(([label, value]) => (
                <div key={label} className="bg-background px-4 py-4">
                  <dt className="data text-[0.58rem] uppercase text-dim">
                    {label}
                  </dt>
                  <dd className="mt-2 text-sm text-ash">{value}</dd>
                </div>
              ))}
            </dl>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="mt-8 h-12 gap-2 px-7 text-base"
            >
              <Link href="/asset-pack">
                Explore the asset pack
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="min-h-[32rem] border border-border bg-background">
            <HeroShowcase className="h-full min-h-[32rem] w-full" />
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <div className="eyebrow mb-4">Coming soon</div>
          <h2 className="max-w-[14ch] text-3xl leading-[1.05] text-foreground md:text-5xl">
            The rest of the deployment loop.
          </h2>
          <p className="prose-body mt-5">
            A scene is the beginning. We are building the infrastructure that
            tests policies against the real site and keeps them current as that
            site changes.
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <ComingSoonCard
              href="/evals"
              icon={<FlaskConical className="size-5" />}
              title="Evals"
              body="Regression testing for robots, built from the tasks and conditions of the real deployment site."
            />
            <ComingSoonCard
              href="/deployments"
              icon={<RefreshCw className="size-5" />}
              title="Post-deployment continual learning"
              body="Re-capture what changed, rerun evaluations, and turn deployment failures into the next training cycle."
            />
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-(--void)">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <div className="eyebrow mb-4">Why Dirac</div>
          <h2 className="max-w-[16ch] text-3xl leading-[1.08] text-foreground md:text-5xl">
            Specificity is what makes robots deployable.
          </h2>
          <div className="mt-10 grid border border-border md:grid-cols-3">
            {WHY_DIRAC.map((item, index) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className={[
                    "px-5 py-6",
                    index < WHY_DIRAC.length - 1
                      ? "border-b border-border md:border-r md:border-b-0"
                      : "",
                  ].join(" ")}
                >
                  <Icon className="size-5 text-dim" />
                  <h3 className="mt-5 text-lg text-foreground">{item.title}</h3>
                  <p className="prose-body mt-3">{item.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <Team />

      <CtaSection
        headline="Show us where your robot needs to work."
        line="Send us the site and the task. We will tell you what we can reconstruct and how fast."
        interest="real2sim"
        sourcePage="/"
      />
    </main>
  );
}

function ComingSoonCard({
  href,
  icon,
  title,
  body,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-64 flex-col border border-border bg-card p-6 transition-colors hover:border-graphite"
    >
      <div className="flex items-start justify-between gap-4 text-dim">
        {icon}
        <span className="data border border-border px-2 py-1 text-[0.58rem] uppercase text-dim">
          Coming soon
        </span>
      </div>
      <div className="mt-auto pt-12">
        <h3 className="text-2xl text-foreground">{title}</h3>
        <p className="prose-body mt-3">{body}</p>
        <span className="mt-6 inline-flex items-center gap-1.5 text-sm text-ash transition-colors group-hover:text-foreground">
          Read more
          <ArrowUpRight className="size-4" />
        </span>
      </div>
    </Link>
  );
}
