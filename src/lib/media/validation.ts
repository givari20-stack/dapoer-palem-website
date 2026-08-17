import { mediaFolders, type MediaFolder } from "@/lib/media/types";

export const maxMediaFileSize = 10 * 1024 * 1024;

const allowedMimeTypes = ["image/png", "image/jpeg", "image/webp"] as const;
type AllowedMimeType = (typeof allowedMimeTypes)[number];

export type ValidatedImage = {
  mimeType: AllowedMimeType;
  width: number;
  height: number;
};

function detectMimeType(bytes: Uint8Array): AllowedMimeType | null {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      if (image.naturalWidth < 1 || image.naturalHeight < 1) {
        reject(new Error("Invalid image dimensions."));
        return;
      }
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("The selected file is not a readable image."));
    };
    image.src = objectUrl;
  });
}

export async function validateImage(file: File): Promise<ValidatedImage> {
  if (file.size < 1 || file.size > maxMediaFileSize) {
    throw new Error("Unsupported file type or file is too large.");
  }

  const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const detectedMimeType = detectMimeType(header);

  if (
    !detectedMimeType ||
    !allowedMimeTypes.includes(file.type as AllowedMimeType) ||
    file.type !== detectedMimeType
  ) {
    throw new Error("Unsupported file type or file is too large.");
  }

  const dimensions = await readImageDimensions(file);
  return { mimeType: detectedMimeType, ...dimensions };
}

export function isMediaFolder(value: string): value is MediaFolder {
  return mediaFolders.includes(value as MediaFolder);
}

export function buildStoragePath(
  folder: MediaFolder,
  userId: string,
  fileName: string,
) {
  const safeName = fileName
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  const finalName = safeName || "image";

  return `${folder}/${userId}/${crypto.randomUUID()}-${finalName}`;
}
