import { notFound, redirect } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { AboutPresentation } from "@/components/public/about-presentation";
import { getAdminUser } from "@/lib/auth/admin";
import type { PublicAboutContent } from "@/lib/public-content";
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

  let imageUrl: string | null = null;
  let imageAlt: string | null = null;
  if (selected.image_media_id) {
    const { data: media } = await supabase.from("media").select("storage_path,alt_text,title").eq("id", selected.image_media_id).maybeSingle();
    if (media) {
      const { data: signed } = await supabase.storage.from("media").createSignedUrl(media.storage_path, 600);
      imageUrl = signed?.signedUrl ?? null;
      imageAlt = media.alt_text || media.title || null;
    }
  }

  const content: PublicAboutContent = {
    id,
    eyebrow: textOrNull(selected.eyebrow),
    heading: String(selected.heading || "About Dapoer Palem"),
    description: textOrNull(selected.description),
    supporting_text: textOrNull(selected.supporting_text),
    cta_label: textOrNull(selected.cta_label),
    cta_url: textOrNull(selected.cta_url),
    image_url: imageUrl,
    image_alt: imageAlt,
  };

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[60] bg-gold px-4 py-2 text-center text-xs font-bold tracking-wide text-dark-green uppercase">
        Secure CMS preview · {revision ? "historical revision" : "current draft"}
      </div>
      <div className="pt-8"><Navbar mode="solid" /><AboutPresentation content={content} /><Footer /></div>
    </>
  );
}

function textOrNull(value: unknown) {
  return typeof value === "string" ? value : null;
}

function PreviewError() {
  return <main className="grid min-h-screen place-items-center bg-cream p-6"><p role="alert" className="rounded-lg border border-gold/40 bg-white p-8">Preview authorization denied or revision unavailable.</p></main>;
}
