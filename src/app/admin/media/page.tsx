import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MediaLibrary } from "@/components/admin/media-library";
import { canManageMedia, getAdminUser } from "@/lib/auth/admin";
import type { MediaItem } from "@/lib/media/types";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Media Library",
  robots: { index: false, follow: false },
};

const mediaColumns = [
  "id",
  "storage_bucket",
  "storage_path",
  "file_name",
  "mime_type",
  "file_size",
  "alt_text",
  "title",
  "description",
  "folder",
  "width",
  "height",
  "created_at",
  "updated_at",
  "active",
].join(",");

export default async function MediaPage() {
  const user = await getAdminUser();

  if (!user) {
    redirect("/login");
  }

  if (!canManageMedia(user.role)) {
    return (
      <section aria-labelledby="media-heading">
        <h1 id="media-heading" className="font-serif text-4xl sm:text-5xl">
          Media Library
        </h1>
        <p role="alert" className="mt-6 rounded-md border border-gold/50 bg-white p-5">
          You do not have permission to manage media.
        </p>
      </section>
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("media")
    .select(mediaColumns)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <section aria-labelledby="media-heading">
        <h1 id="media-heading" className="font-serif text-4xl sm:text-5xl">
          Media Library
        </h1>
        <p role="alert" className="mt-6 rounded-md border border-red-800/20 bg-white p-5 text-red-900">
          Media could not be loaded. Please try again.
        </p>
      </section>
    );
  }

  const records = (data ?? []) as unknown as Omit<MediaItem, "preview_url">[];
  const paths = records.map((item) => item.storage_path);
  const signedUrls = paths.length
    ? await supabase.storage.from("media").createSignedUrls(paths, 600)
    : { data: [] };
  const previewByPath = new Map(
    (signedUrls.data ?? []).map((item) => [item.path, item.signedUrl]),
  );
  const items: MediaItem[] = records.map((item) => ({
    ...item,
    preview_url: previewByPath.get(item.storage_path) ?? null,
  }));

  return (
    <MediaLibrary
      initialItems={items}
      userId={user.id}
      isSuperAdmin={user.role === "super_admin"}
    />
  );
}
