/** Single source of truth for site-wide constants and navigation. */

export const SITE = {
  name: "Dirac Robotics",
  domain: "diracrobotics.com",
  url: "https://diracrobotics.com",
  description:
    "Build accurate robot models, reconstruct real environments, and train, test, and improve policies before and after deployment.",
  bookingUrl:
    "https://cal.com/founders-bow3m9/30min",
  contactEmail: "founders@diracrobotics.com",
} as const;

/**
 * Web derivatives of the Real2Sim launch media. Production can point this at
 * the existing Azure `media/site` prefix with NEXT_PUBLIC_SITE_MEDIA_URL.
 */
const siteMediaRoot = (
  process.env.NEXT_PUBLIC_SITE_MEDIA_URL ?? "/media"
).replace(/\/$/, "");

export const SITE_MEDIA = {
  comparison: `${siteMediaRoot}/real2sim-comparison.webp`,
  launchVideo: `${siteMediaRoot}/dirac-launch.mp4`,
  launchPoster: `${siteMediaRoot}/dirac-launch-poster.webp`,
  scene: `${siteMediaRoot}/real2sim-scene.glb?rev=674d2e5f`,
  scenePoster: `${siteMediaRoot}/real2sim-scene-poster.webp?rev=ef-room-layout-v2`,
} as const;

/**
 * Per-page Open Graph and Twitter cards.
 *
 * Next.js replaces these nested metadata objects wholesale rather than merging
 * them, so a page that sets `openGraph` loses every field the root layout
 * declared. This restates the shared ones and takes the page-specific title,
 * description, and canonical path.
 */
export function socialMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}) {
  return {
    openGraph: {
      type: "website" as const,
      siteName: SITE.name,
      locale: "en_US",
      url: `${SITE.url}${path}`,
      title,
      description,
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
    },
  };
}

export type NavItem = { label: string; href: string };

// Order is fixed by brand spec. The logo is the home-page link.
export const NAV_ITEMS: readonly NavItem[] = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Explore assets", href: "/asset-pack" },
  { label: "Book a call", href: SITE.bookingUrl },
];

/** True when `href` is the active nav item for the current `pathname`. */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
