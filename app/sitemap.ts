import type { MetadataRoute } from "next";

import { SITE } from "@/lib/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/real2sim",
    "/evals",
    "/deployments",
    "/about",
    "/contact",
    "/asset-pack",
    "/community-assets",
    "/requests",
  ];
  const now = new Date();
  return routes.map((path) => ({
    url: `${SITE.url}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.6,
  }));
}
