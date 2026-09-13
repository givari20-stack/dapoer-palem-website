import type { Metadata, ResolvingMetadata } from "next";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { AboutPresentation } from "@/components/public/about-presentation";
import { getAboutContent } from "@/lib/public-content";
import { getPublicSettings } from "@/lib/settings/public";
import { parseOpeningHours } from "@/lib/settings/public";
import { normalizeWhatsAppNumber } from "@/lib/settings/whatsapp";

export const dynamic = "force-dynamic";

export async function generateMetadata(_: PageProps<"/about">, parent: ResolvingMetadata): Promise<Metadata> {
  const content = await getAboutContent();
  if (!content?.seo_title && !content?.seo_description && !content?.seo_image_url) return { alternates: { canonical: "/about" } };
  const inherited = await parent;
  return {
    alternates: { canonical: "/about" },
    ...(content.seo_title ? { title: content.seo_title } : {}),
    ...(content.seo_description ? { description: content.seo_description } : {}),
    openGraph: {
      ...inherited.openGraph,
      ...(content.seo_title ? { title: content.seo_title } : {}),
      ...(content.seo_description ? { description: content.seo_description } : {}),
      ...(content.seo_image_url ? { images: [{ url: content.seo_image_url, alt: content.seo_image_alt || undefined }] } : {}),
    },
  };
}

export default async function AboutPage() {
  const [content, settings] = await Promise.all([getAboutContent(), getPublicSettings()]);
  const whatsapp = normalizeWhatsAppNumber(settings.whatsapp_number);
  const mapsUrl = settings.google_maps_url || (settings.latitude && settings.longitude ? `https://www.google.com/maps?q=${encodeURIComponent(settings.latitude)},${encodeURIComponent(settings.longitude)}` : undefined);
  const contact = {
    brandName: settings.brand_name || "Dapoer Palem",
    tagline: settings.tagline || "Inspired by Nature",
    address: settings.address,
    mapsUrl,
    phone: settings.phone,
    email: settings.email,
    whatsappUrl: whatsapp ? `https://wa.me/${whatsapp}` : undefined,
    openingHours: parseOpeningHours(settings.opening_hours),
  };
  return <><Navbar mode="solid" /><AboutPresentation content={content} contact={contact} /><Footer /></>;
}
