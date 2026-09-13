import type { MetadataRoute } from "next";

import { getPublicSettings, getSiteOrigin } from "@/lib/settings/public";

const publicRoutes = ["", "/about", "/menu", "/promo", "/event", "/gallery", "/reservation", "/contact"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getPublicSettings();
  const origin = getSiteOrigin(settings);
  return publicRoutes.map((path) => ({
    url: `${origin}${path || "/"}`,
    changeFrequency: path === "" ? "weekly" : "monthly",
  }));
}
