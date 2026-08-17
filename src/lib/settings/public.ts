import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export type PublicSettings = Record<string, string>;

export async function getPublicSettings(): Promise<PublicSettings> {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("setting_key,setting_value").eq("is_public", true);
  return Object.fromEntries((data ?? []).filter((item) => item.setting_value !== null).map((item) => [item.setting_key, item.setting_value as string]));
}

export function parseOpeningHours(value: string | undefined) {
  if (!value) return [] as { day: string; hours: string }[];
  try {
    const parsed = JSON.parse(value) as Record<string, { open?: string; close?: string; closed?: boolean }>;
    return Object.entries(parsed).map(([day, period]) => ({
      day: day.charAt(0).toUpperCase() + day.slice(1),
      hours: period.closed ? "Closed" : period.open && period.close ? `${period.open}–${period.close}` : "",
    })).filter((item) => item.hours);
  } catch { return []; }
}

export async function getConfiguredMetadata(): Promise<Partial<Metadata>> {
  const settings = await getPublicSettings();
  const supabase = await createClient();
  let imageUrl: string | undefined;
  let faviconUrl: string | undefined;
  const mediaIds = [settings.og_image, settings.favicon_media_id].filter(Boolean);
  if (mediaIds.length) {
    const { data } = await supabase.from("media").select("id,storage_path").in("id", mediaIds).eq("active", true);
    for (const item of data ?? []) {
      const { data: signed } = await supabase.storage.from("media").createSignedUrl(item.storage_path, 1800);
      if (item.id === settings.og_image) imageUrl = signed?.signedUrl;
      if (item.id === settings.favicon_media_id) faviconUrl = signed?.signedUrl;
    }
  }
  return {
    ...(settings.site_title ? { title: settings.site_title } : {}),
    ...(settings.meta_description ? { description: settings.meta_description } : {}),
    openGraph: {
      type: "website",
      ...(settings.og_title || settings.site_title ? { title: settings.og_title || settings.site_title } : {}),
      ...(settings.og_description || settings.meta_description ? { description: settings.og_description || settings.meta_description } : {}),
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
    ...(faviconUrl ? { icons: { icon: faviconUrl } } : {}),
  };
}
