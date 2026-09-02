import assert from "node:assert/strict";
import test from "node:test";

import { menuCsvHeaders, type MenuCsvRow } from "../src/lib/menu/csv.ts";
import { previewMenuImport } from "../src/lib/menu/import-validation.ts";

const category = { id: "11111111-1111-4111-8111-111111111111", name: "Test Category", slug: "test-category" };

function row(overrides: Partial<MenuCsvRow> = {}) {
  return { ...Object.fromEntries(menuCsvHeaders.map((header) => [header, ""])), name: "Test Item", category: "test-category", price: "100", featured: "false", availability: "available", status: "draft", display_order: "0", slug: "test-item", ...overrides } as MenuCsvRow;
}

test("classifies a valid unseen row as NEW", () => {
  const result = previewMenuImport([row()], [category], []);
  assert.equal(result.rows[0].classification, "NEW");
  assert.equal(result.summary.valid, 1);
});

test("rejects invalid values and missing categories", () => {
  const result = previewMenuImport([row({ category: "missing", price: "-1", featured: "maybe" })], [category], []);
  assert.equal(result.rows[0].classification, "ERROR");
  assert.ok(result.rows[0].errors.length >= 3);
});

test("detects duplicate CSV rows", () => {
  const result = previewMenuImport([row({ sku: "sku 1" }), row({ sku: "SKU-1", slug: "another-item" })], [category], []);
  assert.equal(result.rows[1].classification, "DUPLICATE");
});

test("classifies an explicit existing SKU match as UPDATE", () => {
  const result = previewMenuImport([row({ sku: "sku-1" })], [category], [{ id: "22222222-2222-4222-8222-222222222222", category_id: category.id, name: "Existing", slug: "existing", sku: "SKU-1", updated_at: "2026-01-01T00:00:00Z" }]);
  assert.equal(result.rows[0].classification, "UPDATE");
  assert.equal(result.rows[0].existingId, "22222222-2222-4222-8222-222222222222");
});

test("does not silently update a normalized name-category match", () => {
  const result = previewMenuImport([row()], [category], [{ id: "22222222-2222-4222-8222-222222222222", category_id: category.id, name: " test   item ", slug: "different", sku: null, updated_at: "2026-01-01T00:00:00Z" }]);
  assert.equal(result.rows[0].classification, "DUPLICATE");
});
