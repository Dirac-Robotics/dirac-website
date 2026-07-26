/** Single source of truth for site-wide constants and navigation. */

export const SITE = {
  name: "Dirac Robotics",
  domain: "diracrobotics.com",
  url: "https://diracrobotics.com",
  description:
    "Physics-accurate Isaac Sim assets built from real objects, with measured mass, inertia, friction, and joint dynamics. Every value carries stated uncertainty.",
  calendlyUrl: "https://calendly.com/9i-divyansh/15-min-catchup",
  contactEmail: "hello@diracrobotics.com",
} as const;

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
