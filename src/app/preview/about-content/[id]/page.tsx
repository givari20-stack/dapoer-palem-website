import { notFound, redirect } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { AboutPresentation } from "@/components/public/about-presentation";
import { getAdminUser } from "@/lib/auth/admin";
import { parseAboutItems, type PublicAboutContent } from "@/lib/public-content";
import { getPublicSettings, parseOpeningHours } from "@/lib/settings/public";
import { normalizeWhatsAppNumber } from "@/lib/settings/whatsapp";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RecordRow = Record<string, unknown>;

export default async function AboutPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ revision?: string }>;
}) {
  const user = await getAdminUser();
  if (!user) redirect("/login");
  if (user.role === "reservation_staff") return <PreviewError />;

  const { id } = await params;
  const { revision } = await searchParams;
  const supabase = await createClient();
  const { data: current } = await supabase.from("about_content").select("*").eq("id", id).maybeSingle();
  if (!current) notFound();

  let selected: RecordRow = current;
  if (revision) {
    const { data: historical } = await supabase.from("content_revisions").select("snapshot").eq("id", revision).eq("entity_type", "about_content").eq("entity_id", id).maybeSingle();
    if (!historical) return <PreviewError />;
    selected = { ...current, ...historical.snapshot };
  }

  const mediaIds = [selected.image_media_id, selected.founder_image_media_id, selected.seo_image_media_id].filter((value): value is string => typeof value === "string" && Boolean(value));
  const { data: mediaRows } = mediaIds.length ? await supabase.from("media").select("id,storage_path,alt_text,title").in("id", mediaIds) : { data: [] };
  const { data: signedRows } = mediaRows?.length ? await supabase.storage.from("media").createSignedUrls(mediaRows.map((item) => item.storage_path), 600) : { data: [] };
  const signedByPath = new Map((signedRows ?? []).flatMap((item) => item.path && item.signedUrl ? [[item.path, item.signedUrl]] : []));
  const mediaById = new Map((mediaRows ?? []).map((item) => [item.id, item]));
  const resolveMedia = (value: unknown) => {
    const media = typeof value === "string" ? mediaById.get(value) : undefined;
    return { url: media ? signedByPath.get(media.storage_path) ?? null : null, alt: media?.alt_text || media?.title || null };
  };
  const mainMedia = resolveMedia(selected.image_media_id);
  const founderMedia = resolveMedia(selected.founder_image_media_id);
  const seoMedia = resolveMedia(selected.seo_image_media_id);

  const content: PublicAboutContent = {
    id,
    eyebrow: textOrNull(selected.eyebrow),
    heading: String(selected.heading || "About Dapoer Palem"),
    description: textOrNull(selected.description),
    supporting_text: textOrNull(selected.supporting_text),
    overview_heading: textOrNull(selected.overview_heading),
    story_heading: textOrNull(selected.story_heading),
    story_description: textOrNull(selected.story_description),
    vision_heading: textOrNull(selected.vision_heading),
    vision_description: textOrNull(selected.vision_description),
    mission_heading: textOrNull(selected.mission_heading),
    mission_items: parseAboutItems(selected.mission_items),
    founder_heading: textOrNull(selected.founder_heading),
    founder_name: textOrNull(selected.founder_name),
    founder_role: textOrNull(selected.founder_role),
    founder_description: textOrNull(selected.founder_description),
    founder_image_url: founderMedia.url,
    founder_image_alt: founderMedia.alt,
    brand_identity_heading: textOrNull(selected.brand_identity_heading),
    brand_identity_description: textOrNull(selected.brand_identity_description),
    brand_identity_values: parseAboutItems(selected.brand_identity_values),
    audience_heading: textOrNull(selected.audience_heading),
    audience_description: textOrNull(selected.audience_description),
    audience_items: parseAboutItems(selected.audience_items),
    business_concept_heading: textOrNull(selected.business_concept_heading),
    business_concept_description: textOrNull(selected.business_concept_description),
    business_concept_items: parseAboutItems(selected.business_concept_items),
    offerings_heading: textOrNull(selected.offerings_heading),
    offerings_items: parseAboutItems(selected.offerings_items),
    service_channels_heading: textOrNull(selected.service_channels_heading),
    service_channels_items: parseAboutItems(selected.service_channels_items),
    journey_heading: textOrNull(selected.journey_heading),
    journey_items: parseAboutItems(selected.journey_items),
    operations_heading: textOrNull(selected.operations_heading),
    operations_description: textOrNull(selected.operations_description),
    production_flow_heading: textOrNull(selected.production_flow_heading),
    production_flow_items: parseAboutItems(selected.production_flow_items),
    customer_flow_heading: textOrNull(selected.customer_flow_heading),
    customer_flow_items: parseAboutItems(selected.customer_flow_items),
    location_heading: textOrNull(selected.location_heading),
    location_description: textOrNull(selected.location_description),
    cta_label: textOrNull(selected.cta_label),
    cta_url: textOrNull(selected.cta_url),
    seo_title: textOrNull(selected.seo_title),
    seo_description: textOrNull(selected.seo_description),
    seo_image_url: seoMedia.url,
    seo_image_alt: seoMedia.alt,
    image_url: mainMedia.url,
    image_alt: mainMedia.alt,
  };

  const settings = await getPublicSettings();
  const whatsapp = normalizeWhatsAppNumber(settings.whatsapp_number);
  const mapsUrl = settings.google_maps_url || (settings.latitude && settings.longitude ? `https://www.google.com/maps?q=${encodeURIComponent(settings.latitude)},${encodeURIComponent(settings.longitude)}` : undefined);
  const contact = { brandName: settings.brand_name || "Dapoer Palem", tagline: settings.tagline || "Inspired by Nature", address: settings.address, mapsUrl, phone: settings.phone, email: settings.email, whatsappUrl: whatsapp ? `https://wa.me/${whatsapp}` : undefined, openingHours: parseOpeningHours(settings.opening_hours) };

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[60] bg-gold px-4 py-2 text-center text-xs font-bold tracking-wide text-dark-green uppercase">
        Secure CMS preview · {revision ? "historical revision" : "current draft"}
      </div>
      <div className="pt-8"><Navbar mode="solid" /><AboutPresentation content={content} contact={contact} /><Footer /></div>
    </>
  );
}

function textOrNull(value: unknown) {
  return typeof value === "string" ? value : null;
}

function PreviewError() {
  return <main className="grid min-h-screen place-items-center bg-cream p-6"><p role="alert" className="rounded-lg border border-gold/40 bg-white p-8">Preview authorization denied or revision unavailable.</p></main>;
}
