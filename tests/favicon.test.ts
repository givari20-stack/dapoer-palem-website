import assert from "node:assert/strict";
import test from "node:test";

import { faviconHeaders, faviconPath, hasSquareFaviconDimensions, isUsableFaviconMedia } from "../src/lib/settings/favicon.ts";

const validMedia = {
  active: true,
  height: 96,
  mime_type: "image/png",
  storage_bucket: "media",
  storage_path: "branding/user/favicon.png",
  width: 96,
};

test("uses one stable same-origin favicon path", () => {
  assert.equal(faviconPath, "/favicon.ico");
  assert.equal(faviconPath.includes("?"), false);
});

test("accepts only active square image media from the private media bucket", () => {
  assert.equal(isUsableFaviconMedia(validMedia), true);
  assert.equal(isUsableFaviconMedia({ ...validMedia, active: false }), false);
  assert.equal(isUsableFaviconMedia({ ...validMedia, width: 120 }), false);
  assert.equal(isUsableFaviconMedia({ ...validMedia, mime_type: "application/pdf" }), false);
  assert.equal(isUsableFaviconMedia({ ...validMedia, storage_bucket: "other" }), false);
  assert.equal(isUsableFaviconMedia({ ...validMedia, storage_path: "../favicon.png" }), false);
  assert.equal(isUsableFaviconMedia({ ...validMedia, width: null, height: null }), true);
});

test("validates the actual PNG dimensions when media metadata is absent", () => {
  const png = new Uint8Array(24);
  png.set([0x89, 0x50, 0x4e, 0x47], 0);
  new DataView(png.buffer).setUint32(16, 96);
  new DataView(png.buffer).setUint32(20, 96);
  assert.equal(hasSquareFaviconDimensions(png, "image/png"), true);
  new DataView(png.buffer).setUint32(20, 48);
  assert.equal(hasSquareFaviconDimensions(png, "image/png"), false);
});

test("favicon response headers do not include an indexing restriction", () => {
  const headers = faviconHeaders("image/png", 512);
  assert.equal(headers["Content-Type"], "image/png");
  assert.equal(headers["Content-Length"], "512");
  assert.equal(Object.hasOwn(headers, "X-Robots-Tag"), false);
});
