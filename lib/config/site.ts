/** Single source of truth for site-wide constants and navigation. */

export const SITE = {
  name: "Dirac Robotics",
  domain: "diracrobotics.com",
  url: "https://diracrobotics.com",
  description:
    "Physics-accurate Isaac Sim assets built from real objects. Our Real2Sim pipeline predicts mass, inertia, friction, and joint dynamics automatically, with stated confidence on every value.",
  bookingUrl:
    "https://cal.com/divyansh-chauhan-bqv9r6/quick-chat-with-dirac-robotics",
  contactEmail: "divyansh@diracrobotics.com",
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

// Order is fixed by brand spec. Assets is the home page.
export const NAV_ITEMS: readonly NavItem[] = [
  { label: "Assets", href: "/" },
  { label: "Real2Sim", href: "/real2sim" },
  { label: "Evals", href: "/evals" },
  { label: "Deployments", href: "/deployments" },
  { label: "About", href: "/about" },
  { label: "Contact Us", href: "/contact" },
];

/** True when `href` is the active nav item for the current `pathname`. */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
