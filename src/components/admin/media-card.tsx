"use client";

import type { MediaItem } from "@/lib/media/types";

type MediaCardProps = {
  item: MediaItem;
  onSelect: (item: MediaItem) => void;
};

export function MediaCard({ item, onSelect }: MediaCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="group overflow-hidden rounded-lg border border-dark-green/10 bg-white text-left shadow-[0_8px_30px_rgb(1_58_20_/_0.06)] transition hover:-translate-y-0.5 hover:shadow-soft focus-visible:outline-palem-green"
    >
      <div className="aspect-[4/3] overflow-hidden bg-dark-green/5">
        {item.preview_url ? (
          // Signed private URLs are short-lived and cannot be safely optimized.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.preview_url}
            alt={item.alt_text || item.title || item.file_name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-dark-green/50">
            Preview unavailable
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 truncate text-sm font-semibold" title={item.file_name}>
            {item.file_name}
          </p>
          {!item.active ? (
            <span className="rounded-full bg-dark-green/10 px-2 py-1 text-[0.6rem] font-bold tracking-wide uppercase">
              Archived
            </span>
          ) : null}
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-dark-green/60">
          <div>
            <dt className="sr-only">Folder</dt>
            <dd className="capitalize">{item.folder ?? "Unsorted"}</dd>
          </div>
          <div className="text-right">
            <dt className="sr-only">Dimensions</dt>
            <dd>{item.width && item.height ? `${item.width}×${item.height}` : "—"}</dd>
          </div>
          <div>
            <dt className="sr-only">File type</dt>
            <dd>{item.mime_type.replace("image/", "").toUpperCase()}</dd>
          </div>
          <div className="text-right">
            <dt className="sr-only">Upload date</dt>
            <dd>{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(item.created_at))}</dd>
          </div>
        </dl>
      </div>
    </button>
  );
}
