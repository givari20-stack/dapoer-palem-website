import type { Metadata } from "next";
import { CmsModulePage } from "@/components/admin/cms-module-page";
export const metadata: Metadata = { title: "Gallery CMS", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default function AdminGalleryPage() {
  return <CmsModulePage title="Gallery" description="Organize existing Media Library assets into the public gallery." moduleKeys={["gallery"]} />;
}
