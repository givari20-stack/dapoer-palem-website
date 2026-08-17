import type { Metadata } from "next";

import { CmsModulePage } from "@/components/admin/cms-module-page";

export const metadata: Metadata = { title: "Menu CMS", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function AdminMenuPage() {
  return (
    <CmsModulePage
      title="Menu"
      description="Manage categories and menu items. Prices are stored numerically and displayed as Indonesian Rupiah."
      moduleKeys={["menu-categories", "menu-items"]}
      includeCategories
    />
  );
}
