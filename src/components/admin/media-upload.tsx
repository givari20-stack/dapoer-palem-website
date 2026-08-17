"use client";

import { useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  buildStoragePath,
  validateImage,
} from "@/lib/media/validation";
import {
  mediaFolders,
  type MediaFolder,
  type MediaItem,
} from "@/lib/media/types";
import { createClient } from "@/lib/supabase/client";

const mediaSelect =
  "id,storage_bucket,storage_path,file_name,mime_type,file_size,alt_text,title,description,folder,width,height,created_at,updated_at,active";

type MediaUploadProps = {
  userId: string;
  onUploaded: (item: MediaItem) => void;
};

export function MediaUpload({ userId, onUploaded }: MediaUploadProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function closeDialog() {
    if (busy) return;
    dialogRef.current?.close();
    formRef.current?.reset();
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const file = formData.get("file");
    const folder = formData.get("folder") as MediaFolder;

    if (!(file instanceof File) || file.size === 0) {
      setError("Unsupported file type or file is too large.");
      setBusy(false);
      return;
    }

    try {
      const validated = await validateImage(file);
      const storagePath = buildStoragePath(folder, userId, file.name);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || user.id !== userId) {
        setError("You do not have permission to manage media.");
        return;
      }

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(storagePath, file, {
          cacheControl: "3600",
          contentType: validated.mimeType,
          upsert: false,
        });

      if (uploadError) {
        setError("Upload failed. Please try again.");
        return;
      }

      const { data: record, error: insertError } = await supabase
        .from("media")
        .insert({
          storage_bucket: "media",
          storage_path: storagePath,
          file_name: file.name,
          mime_type: validated.mimeType,
          file_size: file.size,
          folder,
          width: validated.width,
          height: validated.height,
          alt_text: String(formData.get("alt_text") ?? "").trim() || null,
          title: String(formData.get("title") ?? "").trim() || null,
          description:
            String(formData.get("description") ?? "").trim() || null,
        })
        .select(mediaSelect)
        .single();

      if (insertError || !record) {
        await supabase.storage.from("media").remove([storagePath]);
        setError("Upload failed. Please try again.");
        return;
      }

      const { data: preview } = await supabase.storage
        .from("media")
        .createSignedUrl(storagePath, 600);

      onUploaded({
        ...(record as unknown as Omit<MediaItem, "preview_url">),
        preview_url: preview?.signedUrl ?? null,
      });
      dialogRef.current?.close();
      formRef.current?.reset();
      setError(null);
    } catch (uploadFailure) {
      setError(
        uploadFailure instanceof Error &&
          uploadFailure.message ===
            "Unsupported file type or file is too large."
          ? uploadFailure.message
          : "Upload failed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button onClick={() => dialogRef.current?.showModal()}>
        Upload image
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby="upload-title"
        className="m-auto max-h-[calc(100vh-2rem)] w-[min(42rem,calc(100%-2rem))] overflow-y-auto rounded-lg bg-white p-0 text-dark-green shadow-2xl backdrop:bg-dark-green/70"
        onCancel={(event) => {
          if (busy) event.preventDefault();
        }}
      >
        <form ref={formRef} onSubmit={handleSubmit} className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-palem-green uppercase">
                Private storage
              </p>
              <h2 id="upload-title" className="mt-2 font-serif text-3xl">
                Upload media
              </h2>
            </div>
            <button
              type="button"
              onClick={closeDialog}
              disabled={busy}
              aria-label="Close upload dialog"
              className="rounded-md px-3 py-2 text-xl text-dark-green/60 hover:bg-cream"
            >
              ×
            </button>
          </div>

          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="mb-2 block text-sm font-semibold">Image file</span>
              <input
                name="file"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                required
                className="block w-full rounded-md border border-dark-green/20 bg-cream/40 p-3 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-palem-green file:px-4 file:py-2 file:text-xs file:font-bold file:text-white"
              />
              <span className="mt-2 block text-xs text-dark-green/55">
                PNG, JPEG, or WebP. Maximum 10 MB.
              </span>
            </label>

            <Field label="Title" name="title" />
            <Field label="Alt text" name="alt_text" />

            <label>
              <span className="mb-2 block text-sm font-semibold">Folder</span>
              <select
                name="folder"
                defaultValue="uploads"
                className="min-h-12 w-full rounded-md border border-dark-green/20 bg-white px-3"
              >
                {mediaFolders.map((folder) => (
                  <option key={folder} value={folder}>
                    {folder[0].toUpperCase() + folder.slice(1)}
                  </option>
                ))}
              </select>
            </label>

            <label className="sm:col-span-2">
              <span className="mb-2 block text-sm font-semibold">Description</span>
              <textarea
                name="description"
                rows={3}
                className="w-full rounded-md border border-dark-green/20 px-3 py-3"
              />
            </label>
          </div>

          {error ? (
            <p role="alert" className="mt-5 rounded-md bg-red-50 p-3 text-sm text-red-900">
              {error}
            </p>
          ) : null}

          <div className="mt-7 flex flex-wrap justify-end gap-3">
            <Button variant="ghost" onClick={closeDialog} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Uploading..." : "Upload image"}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}

function Field({ label, name }: { label: string; name: string }) {
  return (
    <label>
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <input
        name={name}
        type="text"
        className="min-h-12 w-full rounded-md border border-dark-green/20 px-3"
      />
    </label>
  );
}
