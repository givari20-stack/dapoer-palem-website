import type { Metadata } from "next";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { AboutPresentation } from "@/components/public/about-presentation";
import { getAboutContent } from "@/lib/public-content";

export const metadata: Metadata = {
  title: "About",
  description: "About Dapoer Palem — Inspired by Nature.",
};
export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const content = await getAboutContent();
  return <><Navbar mode="solid" /><AboutPresentation content={content} /><Footer /></>;
}
