import "server-only";

import { createClient } from "@/lib/supabase/server";

export type PublicMedia = {
  storage_path: string;
  alt_text: string | null;
  title: string | null;
};

export type PublicAboutContent = {
  id: string;
  eyebrow: string | null;
  heading: string;
  description: string | null;
  supporting_text: string | null;
  overview_heading: string | null;
  vision_heading: string | null;
  vision_description: string | null;
  mission_heading: string | null;
  mission_items: AboutContentItem[];
  founder_heading: string | null;
  founder_name: string | null;
  founder_role: string | null;
  founder_description: string | null;
  founder_image_url: string | null;
  founder_image_alt: string | null;
  brand_identity_heading: string | null;
  brand_identity_description: string | null;
  audience_heading: string | null;
  audience_description: string | null;
  offerings_heading: string | null;
  offerings_items: AboutContentItem[];
  service_channels_heading: string | null;
  service_channels_items: AboutContentItem[];
  cta_label: string | null;
  cta_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_image_url: string | null;
  seo_image_alt: string | null;
  image_url: string | null;
  image_alt: string | null;
};

export type AboutContentItem = {
  name: string;
  description: string;
  url?: string;
};

export type HomepageSectionContent = {
  eyebrow?: string | null;
  heading?: string | null;
  description?: string | null;
  primary_button_label?: string | null;
  primary_button_url?: string | null;
  secondary_button_label?: string | null;
  secondary_button_url?: string | null;
  image_url?: string | null;
  image_alt?: string | null;
};

export async function signPublicMedia(
  supabase: Awaited<ReturnType<typeof createClient>>,
  paths: string[],
): Promise<Map<string, string>> {
  if (!paths.length) return new Map<string, string>();
  const { data } = await supabase.storage.from("media").createSignedUrls(paths, 1800);
  return new Map((data ?? []).flatMap((item) => item.path && item.signedUrl ? [[item.path, item.signedUrl]] : []));
}

export async function getAboutContent(): Promise<PublicAboutContent | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("about_content")
    .select("*,media:image_media_id(storage_path,alt_text,title),founder_media:founder_image_media_id(storage_path,alt_text,title),seo_media:seo_image_media_id(storage_path,alt_text,title)")
    .eq("status", "published")
    .eq("active", true)
    .maybeSingle();

  if (!data) return null;

  const media = data.media as unknown as PublicMedia | null;
  const founderMedia = data.founder_media as unknown as PublicMedia | null;
  const seoMedia = data.seo_media as unknown as PublicMedia | null;
  const signed = await signPublicMedia(supabase, [media, founderMedia, seoMedia].flatMap((item) => item?.storage_path ? [item.storage_path] : []));

  return {
    id: data.id,
    eyebrow: data.eyebrow,
    heading: data.heading,
    description: data.description,
    supporting_text: data.supporting_text,
    overview_heading: data.overview_heading,
    vision_heading: data.vision_heading,
    vision_description: data.vision_description,
    mission_heading: data.mission_heading,
    mission_items: parseAboutItems(data.mission_items),
    founder_heading: data.founder_heading,
    founder_name: data.founder_name,
    founder_role: data.founder_role,
    founder_description: data.founder_description,
    founder_image_url: founderMedia ? signed.get(founderMedia.storage_path) ?? null : null,
    founder_image_alt: founderMedia?.alt_text ?? founderMedia?.title ?? null,
    brand_identity_heading: data.brand_identity_heading,
    brand_identity_description: data.brand_identity_description,
    audience_heading: data.audience_heading,
    audience_description: data.audience_description,
    offerings_heading: data.offerings_heading,
    offerings_items: parseAboutItems(data.offerings_items),
    service_channels_heading: data.service_channels_heading,
    service_channels_items: parseAboutItems(data.service_channels_items),
    cta_label: data.cta_label,
    cta_url: data.cta_url,
    seo_title: data.seo_title,
    seo_description: data.seo_description,
    seo_image_url: seoMedia ? signed.get(seoMedia.storage_path) ?? null : null,
    seo_image_alt: seoMedia?.alt_text ?? seoMedia?.title ?? null,
    image_url: media ? signed.get(media.storage_path) ?? null : null,
    image_alt: media?.alt_text ?? media?.title ?? null,
  };
}

export function parseAboutItems(value: unknown): AboutContentItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const record = item as Record<string, unknown>;
    if (typeof record.name !== "string" || typeof record.description !== "string") return [];
    return [{
      name: record.name,
      description: record.description,
      ...(typeof record.url === "string" && record.url ? { url: record.url } : {}),
    }];
  });
}

export async function getHomepageContent() {
  const supabase = await createClient();
  const [sectionsResult, experiencesResult, promosResult, eventsResult] =
    await Promise.all([
      supabase
        .from("homepage_content")
        .select("*,media:image_media_id(storage_path,alt_text,title)")
        .eq("status", "published")
        .eq("active", true),
      supabase
        .from("homepage_experiences")
        .select("*,media:image_media_id(storage_path,alt_text,title)")
        .eq("status", "published")
        .eq("active", true)
        .order("display_order"),
      supabase
        .from("promos")
        .select("title,short_description,cta_label,cta_url,start_date,end_date,media:image_media_id(storage_path,alt_text,title)")
        .eq("status", "published")
        .or(`start_date.is.null,start_date.lte.${new Date().toISOString()}`)
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`)
        .order("display_order")
        .limit(1),
      supabase
        .from("events")
        .select("title,description,cta_label,cta_url,event_date,start_time,end_time,location,media:image_media_id(storage_path,alt_text,title)")
        .eq("status", "published")
        .gte("event_date", new Date().toISOString().slice(0, 10))
        .order("event_date")
        .limit(1),
    ]);

  const sections = sectionsResult.data ?? [];
  const experiences = experiencesResult.data ?? [];
  const promos = promosResult.data ?? [];
  const events = eventsResult.data ?? [];
  const paths = [...sections, ...experiences, ...promos, ...events]
    .map((record) => {
      const media = record.media as unknown as PublicMedia | null;
      return media?.storage_path;
    })
    .filter((path): path is string => Boolean(path));
  const signed = await signPublicMedia(supabase, paths);

  return {
    sections: new Map<string, HomepageSectionContent>(
      sections.map((section) => {
        const media = section.media as unknown as PublicMedia | null;
        return [section.section_key, {
          ...section,
          image_url: media ? signed.get(media.storage_path) ?? null : null,
          image_alt: media?.alt_text ?? media?.title ?? null,
        }];
      }),
    ),
    experiences: experiences.map((experience) => {
      const media = experience.media as unknown as PublicMedia | null;
      return {
        ...experience,
        image_url: media ? signed.get(media.storage_path) ?? null : null,
        image_alt: media?.alt_text ?? media?.title ?? null,
      };
    }),
    promo: promos[0] ? attachSignedMedia(promos[0], signed) : null,
    event: events[0] ? attachSignedMedia(events[0], signed) : null,
  };
}

function attachSignedMedia<T extends { media: unknown }>(record: T, signed: Map<string, string>) {
  const media = record.media as PublicMedia | null;
  return {
    ...record,
    image_url: media ? signed.get(media.storage_path) ?? null : null,
    image_alt: media?.alt_text ?? media?.title ?? null,
  };
}

export async function getPublicCollection(
  table: "promos" | "events" | "gallery_items" | "menu_items",
) {
  const supabase = await createClient();
  let query = supabase.from(table).select("*,media:image_media_id(storage_path,alt_text,title)");

  if (table === "gallery_items") {
    query = supabase
      .from("gallery_items")
      .select("*,media:media_id(storage_path,alt_text,title)")
      .eq("status", "published")
      .eq("active", true);
  } else {
    query = query.eq("status", "published");
  }
  if (table === "menu_items") query = query.eq("availability", "available");
  if (table === "promos") {
    const now = new Date().toISOString();
    query = query.or(`start_date.is.null,start_date.lte.${now}`).or(`end_date.is.null,end_date.gte.${now}`);
  }

  const { data } = await query.order("display_order");
  const records = data ?? [];
  const paths = records
    .map((record) => (record.media as unknown as PublicMedia | null)?.storage_path)
    .filter((path): path is string => Boolean(path));
  const signed = await signPublicMedia(supabase, paths);

  return records.map((record) => {
    const media = record.media as unknown as PublicMedia | null;
    return {
      ...record,
      image_url: media ? signed.get(media.storage_path) ?? null : null,
      image_alt: media?.alt_text ?? media?.title ?? null,
    } as Record<string, unknown> & { image_url: string | null; image_alt: string | null };
  });
}

export async function getPublicMenu() {
  const supabase = await createClient();
  const [categoriesResult, itemsResult] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("id,name,slug,description,display_order")
      .eq("active", true)
      .eq("status", "published")
      .order("display_order"),
    supabase
      .from("menu_items")
      .select("*,media:image_media_id(storage_path,alt_text,title)")
      .eq("status", "published")
      .eq("availability", "available")
      .order("display_order"),
  ]);
  const items = itemsResult.data ?? [];
  const paths = items
    .map((record) => (record.media as unknown as PublicMedia | null)?.storage_path)
    .filter((path): path is string => Boolean(path));
  const signed = await signPublicMedia(supabase, paths);

  return {
    categories: categoriesResult.data ?? [],
    items: items.map((record) => {
      const media = record.media as unknown as PublicMedia | null;
      return {
        ...record,
        image_url: media ? signed.get(media.storage_path) ?? null : null,
        image_alt: media?.alt_text ?? media?.title ?? null,
      };
    }),
  };
}
