export const faviconPath = "/favicon.ico";

export const supportedFaviconMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type FaviconMedia = {
  active: boolean;
  height: number | null;
  mime_type: string;
  storage_bucket: string;
  storage_path: string;
  width: number | null;
};

export function isUsableFaviconMedia(value: unknown): value is FaviconMedia {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const media = value as Record<string, unknown>;
  const path = typeof media.storage_path === "string" ? media.storage_path : "";
  const pathSegments = path.split("/");

  return media.active === true
    && media.storage_bucket === "media"
    && supportedFaviconMimeTypes.includes(media.mime_type as (typeof supportedFaviconMimeTypes)[number])
    && path.length > 0
    && !path.startsWith("/")
    && !path.includes("\\")
    && pathSegments.every((segment) => segment.length > 0 && segment !== "." && segment !== "..")
    && ((media.width === null && media.height === null)
      || (Number.isInteger(media.width)
        && Number.isInteger(media.height)
        && Number(media.width) >= 8
        && media.width === media.height));
}

export function hasSquareFaviconDimensions(bytes: Uint8Array, mimeType: string) {
  const dimensions = mimeType === "image/png"
    ? pngDimensions(bytes)
    : mimeType === "image/jpeg"
      ? jpegDimensions(bytes)
      : mimeType === "image/webp"
        ? webpDimensions(bytes)
        : null;
  return Boolean(dimensions && dimensions.width >= 8 && dimensions.width === dimensions.height);
}

function pngDimensions(bytes: Uint8Array) {
  if (bytes.length < 24 || bytes[0] !== 0x89 || text(bytes, 1, 3) !== "PNG") return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

function jpegDimensions(bytes: Uint8Array) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  const startOfFrameMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  let offset = 2;
  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) { offset += 1; continue; }
    const marker = bytes[offset + 1];
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) { offset += 2; continue; }
    const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (length < 2 || offset + length + 2 > bytes.length) return null;
    if (startOfFrameMarkers.has(marker)) return {
      height: (bytes[offset + 5] << 8) | bytes[offset + 6],
      width: (bytes[offset + 7] << 8) | bytes[offset + 8],
    };
    offset += length + 2;
  }
  return null;
}

function webpDimensions(bytes: Uint8Array) {
  if (bytes.length < 30 || text(bytes, 0, 4) !== "RIFF" || text(bytes, 8, 4) !== "WEBP") return null;
  const chunk = text(bytes, 12, 4);
  if (chunk === "VP8X") return { width: 1 + uint24(bytes, 24), height: 1 + uint24(bytes, 27) };
  if (chunk === "VP8L" && bytes[20] === 0x2f) return {
    width: 1 + bytes[21] + ((bytes[22] & 0x3f) << 8),
    height: 1 + (bytes[22] >> 6) + (bytes[23] << 2) + ((bytes[24] & 0x0f) << 10),
  };
  if (chunk === "VP8 " && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) return {
    width: (bytes[26] | (bytes[27] << 8)) & 0x3fff,
    height: (bytes[28] | (bytes[29] << 8)) & 0x3fff,
  };
  return null;
}

function text(bytes: Uint8Array, start: number, length: number) {
  return String.fromCharCode(...bytes.subarray(start, start + length));
}

function uint24(bytes: Uint8Array, start: number) {
  return bytes[start] | (bytes[start + 1] << 8) | (bytes[start + 2] << 16);
}

export function faviconHeaders(contentType: string, contentLength: number) {
  return {
    "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    "Content-Length": String(contentLength),
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
  };
}
