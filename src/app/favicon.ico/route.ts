import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  faviconHeaders,
  hasSquareFaviconDimensions,
  isUsableFaviconMedia,
} from "@/lib/settings/favicon";
import { getSupabaseEnvironment } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

type SettingRow = { setting_value: string | null };

export async function GET() {
  try {
    const environment = getSupabaseEnvironment();
    if (!environment) return fallbackResponse();
    const headers = {
      apikey: environment.publishableKey,
      Authorization: `Bearer ${environment.publishableKey}`,
    };
    const requestOptions = {
      cache: "no-store" as const,
      headers,
      signal: AbortSignal.timeout(20_000),
    };

    const settingResponse = await fetch(
      `${environment.url}/rest/v1/site_settings?select=setting_value&setting_key=eq.favicon_media_id&is_public=eq.true&limit=1`,
      requestOptions,
    );
    if (!settingResponse.ok) return fallbackResponse();
    const settings = await settingResponse.json() as SettingRow[];
    const mediaId = settings[0]?.setting_value;
    if (!mediaId || !/^[0-9a-f-]{36}$/i.test(mediaId)) return fallbackResponse();

    const mediaResponse = await fetch(
      `${environment.url}/rest/v1/media?select=storage_bucket,storage_path,mime_type,width,height,active&id=eq.${encodeURIComponent(mediaId)}&active=eq.true&limit=1`,
      requestOptions,
    );
    if (!mediaResponse.ok) return fallbackResponse();
    const mediaRows = await mediaResponse.json() as unknown[];
    const media = mediaRows[0];
    if (!isUsableFaviconMedia(media)) return fallbackResponse();

    const encodedPath = media.storage_path.split("/").map(encodeURIComponent).join("/");
    const image = await fetch(
      `${environment.url}/storage/v1/object/authenticated/${media.storage_bucket}/${encodedPath}`,
      requestOptions,
    );
    if (!image.ok) return fallbackResponse();
    const upstreamType = image.headers.get("content-type")?.split(";", 1)[0].toLowerCase();
    if (upstreamType !== media.mime_type) return fallbackResponse();

    const bytes = new Uint8Array(await image.arrayBuffer());
    if (!hasSquareFaviconDimensions(bytes, media.mime_type)) return fallbackResponse();
    return new Response(bytes, {
      headers: faviconHeaders(media.mime_type, bytes.length),
    });
  } catch {
    return fallbackResponse();
  }
}

async function fallbackResponse() {
  const bytes = await readFile(path.join(process.cwd(), "public", "logo", "dapoer-palem-black.png"));
  return new Response(bytes, {
    headers: faviconHeaders("image/png", bytes.byteLength),
  });
}
