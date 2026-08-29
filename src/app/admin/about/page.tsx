import type { Metadata } from "next";

import { CmsModulePage } from "@/components/admin/cms-module-page";

export const metadata: Metadata = { title: "About CMS", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function AdminAboutPage() {
  return <CmsModulePage title="About" description="Manage the approved About story, supporting copy, Media Library image, and call to action. The page layout remains fixed in code." moduleKeys={["about-content"]} />;
}
