import type { Metadata } from "next";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { AboutPresentation } from "@/components/public/about-presentation";
import { getAboutContent } from "@/lib/public-content";
import { getPublicSettings } from "@/lib/settings/public";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getAboutContent();
  return {
    title: content?.heading || "About",
    description: content?.description || "About Dapoer Palem — Inspired by Nature.",
  };
}

export default async function AboutPage() {
  const [content, settings] = await Promise.all([getAboutContent(), getPublicSettings()]);
  return <><Navbar mode="solid" /><AboutPresentation content={content} tagline={settings.tagline} /><Footer /></>;
}
