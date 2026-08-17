import type { Metadata } from "next";
import { CollectionPage } from "@/components/public/collection-page";
import { getPublicCollection } from "@/lib/public-content";
export const metadata: Metadata = { title: "Promo", description: "Published Dapoer Palem promotions." };
export const dynamic = "force-dynamic";
export default async function PromoPage() {
  const records = await getPublicCollection("promos");
  return <CollectionPage eyebrow="Promo" title="Current offers." description="Published Dapoer Palem promotions appear here when available." emptyMessage="There are no published promotions at this time." records={records} variant="promo" />;
}
