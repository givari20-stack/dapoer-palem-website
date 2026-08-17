import type { Metadata } from "next";
import { CmsModulePage } from "@/components/admin/cms-module-page";
export const metadata: Metadata = { title: "Promo CMS", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default function AdminPromosPage() {
  return <CmsModulePage title="Promos" description="Create and schedule promotions with controlled public visibility." moduleKeys={["promos"]} />;
}
