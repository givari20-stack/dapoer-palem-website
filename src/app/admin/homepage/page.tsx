import type { Metadata } from "next";

import { CmsModulePage } from "@/components/admin/cms-module-page";

export const metadata: Metadata = { title: "Homepage CMS", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function AdminHomepagePage() {
  return (
    <CmsModulePage
      title="Homepage"
      description="Manage approved homepage copy, calls to action, media references, and experience cards. Layout remains fixed in code."
      moduleKeys={["homepage-content", "homepage-experiences"]}
    />
  );
}
