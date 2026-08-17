import type { Metadata } from "next";
import { CollectionPage } from "@/components/public/collection-page";
import { getPublicCollection } from "@/lib/public-content";
export const metadata: Metadata = { title: "Gallery", description: "Published Dapoer Palem gallery." };
export const dynamic = "force-dynamic";
export default async function GalleryPage() {
  const records = await getPublicCollection("gallery_items");
  return <CollectionPage eyebrow="Gallery" title="A sense of place." description="Approved Dapoer Palem imagery appears here when published." emptyMessage="No gallery images have been published yet." records={records} variant="gallery" />;
}
