export const mediaFolders = [
  "branding",
  "homepage",
  "menu",
  "promos",
  "events",
  "gallery",
  "uploads",
] as const;

export type MediaFolder = (typeof mediaFolders)[number];

export type MediaItem = {
  id: string;
  storage_bucket: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  alt_text: string | null;
  title: string | null;
  description: string | null;
  folder: MediaFolder | null;
  width: number | null;
  height: number | null;
  created_at: string;
  updated_at: string;
  active: boolean;
  preview_url: string | null;
};
