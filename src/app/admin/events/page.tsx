import type { Metadata } from "next";
import { CmsModulePage } from "@/components/admin/cms-module-page";
export const metadata: Metadata = { title: "Event CMS", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default function AdminEventsPage() {
  return <CmsModulePage title="Events" description="Manage event dates, times, details, and publication state." moduleKeys={["events"]} />;
}
