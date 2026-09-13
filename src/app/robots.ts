import type { MetadataRoute } from "next";

import { getPublicSettings, getSiteOrigin } from "@/lib/settings/public";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getPublicSettings();
  const origin = getSiteOrigin(settings);
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/login", "/os", "/preview"],
    },
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
