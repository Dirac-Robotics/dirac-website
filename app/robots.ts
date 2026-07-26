import type { MetadataRoute } from "next";

import { SITE } from "@/lib/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Admin, auth, and API surfaces should not be indexed.
      disallow: ["/admin", "/signin", "/api/"],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
