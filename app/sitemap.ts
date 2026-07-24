import type { MetadataRoute } from "next";

const SITE_URL = "https://diracrobotics.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/real2sim", "/evals", "/deployments", "/about", "/contact"];
  const now = new Date();
  return routes.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.6,
  }));
}
