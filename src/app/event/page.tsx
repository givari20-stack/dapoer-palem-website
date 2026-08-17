import type { Metadata } from "next";
import { CollectionPage } from "@/components/public/collection-page";
import { getPublicCollection } from "@/lib/public-content";
export const metadata: Metadata = { title: "Events", description: "Published Dapoer Palem events." };
export const dynamic = "force-dynamic";
export default async function EventPage() {
  const records = await getPublicCollection("events");
  return <CollectionPage eyebrow="Events" title="Gather with us." description="Published Dapoer Palem event information appears here when available." emptyMessage="There are no published events at this time." records={records} variant="event" />;
}
