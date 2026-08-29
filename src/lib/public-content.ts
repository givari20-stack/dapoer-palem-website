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
  cta_label: string | null;
  cta_url: string | null;
  image_url: string | null;
  image_alt: string | null;
};

export async function signPublicMedia(
  supabase: Awaited<ReturnType<typeof createClient>>,
  paths: string[],
) {
  if (!paths.length) return new Map<string, string>();
  const { data } = await supabase.storage.from("media").createSignedUrls(paths, 1800);
  return new Map((data ?? []).map((item) => [item.path, item.signedUrl]));
}

export async function getAboutContent(): Promise<PublicAboutContent | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("about_content")
    .select("*,media:image_media_id(storage_path,alt_text,title)")
    .eq("status", "published")
    .eq("active", true)
    .maybeSingle();

  if (!data) return null;

  const media = data.media as unknown as PublicMedia | null;
  const signed = media
    ? await signPublicMedia(supabase, [media.storage_path])
    : new Map<string, string>();

  return {
    id: data.id,
    eyebrow: data.eyebrow,
    heading: data.heading,
    description: data.description,
    supporting_text: data.supporting_text,
    cta_label: data.cta_label,
    cta_url: data.cta_url,
    image_url: media ? signed.get(media.storage_path) ?? null : null,
    image_alt: media?.alt_text ?? media?.title ?? null,
  };
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
        .select("title,short_description,cta_label,cta_url,start_date,end_date")
        .eq("status", "published")
        .or(`start_date.is.null,start_date.lte.${new Date().toISOString()}`)
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`)
        .order("display_order")
        .limit(1),
      supabase
        .from("events")
        .select("title,description,cta_label,cta_url,event_date")
        .eq("status", "published")
        .order("event_date")
        .limit(1),
    ]);

  const sections = sectionsResult.data ?? [];
  const experiences = experiencesResult.data ?? [];
  const paths = [...sections, ...experiences]
    .map((record) => {
      const media = record.media as unknown as PublicMedia | null;
      return media?.storage_path;
    })
    .filter((path): path is string => Boolean(path));
  const signed = await signPublicMedia(supabase, paths);

  return {
    sections: new Map(
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
    promo: promosResult.data?.[0] ?? null,
    event: eventsResult.data?.[0] ?? null,
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
