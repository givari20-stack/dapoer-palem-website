"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { MediaCard } from "@/components/admin/media-card";
import { MediaUpload } from "@/components/admin/media-upload";
import { Button } from "@/components/ui/button";
import {
  mediaFolders,
  type MediaFolder,
  type MediaItem,
} from "@/lib/media/types";
import { createClient } from "@/lib/supabase/client";

const mediaSelect =
  "id,storage_bucket,storage_path,file_name,mime_type,file_size,alt_text,title,description,folder,width,height,created_at,updated_at,active";

type MediaLibraryProps = {
  initialItems: MediaItem[];
  userId: string;
  isSuperAdmin: boolean;
};

type SortOption = "newest" | "oldest" | "name";

export function MediaLibrary({
  initialItems,
  userId,
  isSuperAdmin,
}: MediaLibraryProps) {
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState("");
  const [folder, setFolder] = useState<MediaFolder | "all">("all");
  const [sort, setSort] = useState<SortOption>("newest");
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const visibleItems = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return items
      .filter((item) => {
        const matchesFolder = folder === "all" || item.folder === folder;
        const matchesSearch =
          !term ||
          [item.file_name, item.title, item.alt_text, item.description]
            .filter(Boolean)
            .some((value) => value?.toLocaleLowerCase().includes(term));
        return matchesFolder && matchesSearch;
      })
      .sort((a, b) => {
        if (sort === "name") return a.file_name.localeCompare(b.file_name);
        const direction = sort === "newest" ? -1 : 1;
        return direction * (Date.parse(a.created_at) - Date.parse(b.created_at));
      });
  }, [folder, items, search, sort]);

  function replaceItem(updated: MediaItem) {
    setItems((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );
    setSelected(updated);
  }

  return (
    <section aria-labelledby="media-heading">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-palem-green uppercase">
            Content assets
          </p>
          <h1 id="media-heading" className="mt-2 font-serif text-4xl sm:text-5xl">
            Media Library
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-dark-green/65">
            Upload and organize private image assets for Dapoer Palem content.
          </p>
        </div>
        <MediaUpload
          userId={userId}
          onUploaded={(item) => {
            setItems((current) => [item, ...current]);
            setNotice("Image uploaded successfully.");
          }}
        />
      </div>

      {notice ? (
        <div
          role="status"
          className="mt-6 flex items-center justify-between gap-4 rounded-md border border-palem-green/20 bg-white px-4 py-3 text-sm"
        >
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="rounded px-2 py-1 font-semibold"
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 rounded-lg border border-dark-green/10 bg-white p-4 sm:grid-cols-3 sm:p-5">
        <label>
          <span className="mb-2 block text-xs font-bold tracking-wide uppercase">Search</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search media"
            className="min-h-12 w-full rounded-md border border-dark-green/20 px-3"
          />
        </label>
        <label>
          <span className="mb-2 block text-xs font-bold tracking-wide uppercase">Folder</span>
          <select
            value={folder}
            onChange={(event) => setFolder(event.target.value as MediaFolder | "all")}
            className="min-h-12 w-full rounded-md border border-dark-green/20 bg-white px-3"
          >
            <option value="all">All folders</option>
            {mediaFolders.map((value) => (
              <option key={value} value={value}>
                {value[0].toUpperCase() + value.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-2 block text-xs font-bold tracking-wide uppercase">Sort</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortOption)}
            className="min-h-12 w-full rounded-md border border-dark-green/20 bg-white px-3"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>

      {visibleItems.length ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {visibleItems.map((item) => (
            <MediaCard key={item.id} item={item} onSelect={setSelected} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-dashed border-dark-green/20 bg-white px-6 py-16 text-center">
          <p className="font-serif text-2xl">No media uploaded yet.</p>
          {(search || folder !== "all") && items.length ? (
            <p className="mt-2 text-sm text-dark-green/60">
              No media matches the current filters.
            </p>
          ) : null}
        </div>
      )}

      <MediaDetails
        item={selected}
        isSuperAdmin={isSuperAdmin}
        onClose={() => setSelected(null)}
        onUpdated={replaceItem}
        onDeleted={(id) => {
          setItems((current) => current.filter((item) => item.id !== id));
          setSelected(null);
          setNotice("Media deleted successfully.");
        }}
      />
    </section>
  );
}

type MediaDetailsProps = {
  item: MediaItem | null;
  isSuperAdmin: boolean;
  onClose: () => void;
  onUpdated: (item: MediaItem) => void;
  onDeleted: (id: string) => void;
};

function MediaDetails({
  item,
  isSuperAdmin,
  onClose,
  onUpdated,
  onDeleted,
}: MediaDetailsProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item && !dialogRef.current?.open) {
      dialogRef.current?.showModal();
    }
  }, [item]);

  function close() {
    if (busy) return;
    dialogRef.current?.close();
    setError(null);
    onClose();
  }

  async function updateMetadata(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!item) return;
    setBusy(true);
    setError(null);
    const formData = new FormData(event.currentTarget);
    const supabase = createClient();
    const { data, error: updateError } = await supabase
      .from("media")
      .update({
        title: String(formData.get("title") ?? "").trim() || null,
        alt_text: String(formData.get("alt_text") ?? "").trim() || null,
        description: String(formData.get("description") ?? "").trim() || null,
        folder: String(formData.get("folder") ?? "uploads"),
      })
      .eq("id", item.id)
      .select(mediaSelect)
      .single();

    if (updateError || !data) {
      setError("Changes could not be saved. Please try again.");
    } else {
      onUpdated({
        ...(data as unknown as Omit<MediaItem, "preview_url">),
        preview_url: item.preview_url,
      });
      setError(null);
    }
    setBusy(false);
  }

  async function archive() {
    if (!item) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { data, error: archiveError } = await supabase
      .from("media")
      .update({ active: !item.active })
      .eq("id", item.id)
      .select(mediaSelect)
      .single();

    if (archiveError || !data) {
      setError("Archive status could not be changed. Please try again.");
    } else {
      onUpdated({
        ...(data as unknown as Omit<MediaItem, "preview_url">),
        preview_url: item.preview_url,
      });
    }
    setBusy(false);
  }

  async function hardDelete() {
    if (!item || !isSuperAdmin) return;
    if (!window.confirm("Permanently delete this unused media asset?")) return;

    setBusy(true);
    setError(null);
    const supabase = createClient();
    const references = [
      ["homepage_content", "image_media_id"],
      ["homepage_experiences", "image_media_id"],
      ["menu_items", "image_media_id"],
      ["promos", "image_media_id"],
      ["events", "image_media_id"],
      ["gallery_items", "media_id"],
    ] as const;

    const checks = await Promise.all(
      references.map(async ([table, column]) => {
        const { count, error: referenceError } = await supabase
          .from(table)
          .select("id", { count: "exact", head: true })
          .eq(column, item.id);
        return { table, count, referenceError };
      }),
    );

    if (checks.some((check) => check.referenceError)) {
      setError("Media references could not be checked. Nothing was deleted.");
      setBusy(false);
      return;
    }

    const usedBy = checks.filter((check) => (check.count ?? 0) > 0);
    if (usedBy.length) {
      setError(
        `This image is in use by ${usedBy.map((check) => check.table.replaceAll("_", " ")).join(", ")}. Archive it instead.`,
      );
      setBusy(false);
      return;
    }

    const { error: storageError } = await supabase.storage
      .from(item.storage_bucket)
      .remove([item.storage_path]);
    if (storageError) {
      setError("Delete failed. Please try again.");
      setBusy(false);
      return;
    }

    const { error: metadataError } = await supabase
      .from("media")
      .delete()
      .eq("id", item.id);
    if (metadataError) {
      setError("Delete could not be completed safely. Please contact an administrator.");
      setBusy(false);
      return;
    }

    onDeleted(item.id);
    setBusy(false);
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="media-details-title"
      className="m-auto max-h-[calc(100vh-2rem)] w-[min(58rem,calc(100%-2rem))] overflow-y-auto rounded-lg bg-white p-0 text-dark-green shadow-2xl backdrop:bg-dark-green/70"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClose={() => {
        if (item) onClose();
      }}
    >
      {item ? (
        <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
          <div className="flex min-h-72 items-center justify-center bg-dark-green/5 p-4">
            {item.preview_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.preview_url}
                alt={item.alt_text || item.title || item.file_name}
                className="max-h-[70vh] max-w-full object-contain"
              />
            ) : (
              <p className="text-sm text-dark-green/50">Preview unavailable</p>
            )}
          </div>
          <form key={item.id} onSubmit={updateMetadata} className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-5">
              <div className="min-w-0">
                <p className="truncate text-xs tracking-wide text-palem-green uppercase">
                  {item.file_name}
                </p>
                <h2 id="media-details-title" className="mt-2 font-serif text-3xl">
                  Media details
                </h2>
              </div>
              <button
                type="button"
                onClick={close}
                disabled={busy}
                aria-label="Close media details"
                className="rounded px-3 py-2 text-xl hover:bg-cream"
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <DetailField label="Title" name="title" defaultValue={item.title ?? ""} />
              <DetailField label="Alt text" name="alt_text" defaultValue={item.alt_text ?? ""} />
              <label>
                <span className="mb-2 block text-sm font-semibold">Folder</span>
                <select
                  name="folder"
                  defaultValue={item.folder ?? "uploads"}
                  className="min-h-12 w-full rounded-md border border-dark-green/20 bg-white px-3"
                >
                  {mediaFolders.map((value) => (
                    <option key={value} value={value}>
                      {value[0].toUpperCase() + value.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-2 block text-sm font-semibold">Description</span>
                <textarea
                  name="description"
                  rows={4}
                  defaultValue={item.description ?? ""}
                  className="w-full rounded-md border border-dark-green/20 px-3 py-3"
                />
              </label>
            </div>

            <p className="mt-4 text-xs text-dark-green/50">
              {item.mime_type} · {(item.file_size / 1024 / 1024).toFixed(2)} MB · {item.width ?? "—"}×{item.height ?? "—"}
            </p>

            {error ? (
              <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-900">
                {error}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <Button type="submit" disabled={busy}>
                {busy ? "Saving..." : "Save changes"}
              </Button>
              <Button type="button" variant="secondary" onClick={archive} disabled={busy}>
                {item.active ? "Archive" : "Restore"}
              </Button>
              {isSuperAdmin ? (
                <button
                  type="button"
                  onClick={hardDelete}
                  disabled={busy}
                  className="min-h-12 rounded-full px-4 text-xs font-bold tracking-wide text-red-800 uppercase hover:bg-red-50 disabled:opacity-50"
                >
                  Delete permanently
                </button>
              ) : null}
            </div>
          </form>
        </div>
      ) : null}
    </dialog>
  );
}

function DetailField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <input
        name={name}
        type="text"
        defaultValue={defaultValue}
        className="min-h-12 w-full rounded-md border border-dark-green/20 px-3"
      />
    </label>
  );
}
