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

test("rejects invalid values and unusable category names", () => {
  const result = previewMenuImport([row({ category: "***", price: "-1", featured: "maybe" })], [category], []);
  assert.equal(result.rows[0].classification, "ERROR");
  assert.ok(result.rows[0].errors.length >= 3);
});

test("classifies normalized missing category references once for explicit creation", () => {
  const result = previewMenuImport([
    row({ category: " Drinks ", slug: "first" }),
    row({ category: "DRINKS", name: "Second", slug: "second" }),
  ], [category], []);
  assert.equal(result.newCategories.length, 1);
  assert.equal(result.newCategories[0].name, "Drinks");
  assert.deepEqual(result.newCategories[0].rowNumbers, [2, 3]);
  assert.equal(result.rows[0].categoryClassification, "NEW_CATEGORY");
});

test("resolves category names and slugs as existing without creating duplicates", () => {
  const result = previewMenuImport([
    row({ category: " test   CATEGORY ", slug: "by-name" }),
    row({ category: "test-category", name: "By slug", slug: "by-slug" }),
  ], [category], []);
  assert.equal(result.newCategories.length, 0);
  assert.equal(result.rows[0].categoryClassification, "EXISTING");
  assert.equal(result.rows[1].categoryClassification, "EXISTING");
});

test("rejects a new category whose generated slug belongs to a different category", () => {
  const result = previewMenuImport([row({ category: "Test Category", slug: "conflict-item" })], [{ ...category, name: "Different Name" }], []);
  assert.equal(result.rows[0].categoryClassification, "ERROR");
  assert.equal(result.rows[0].classification, "ERROR");
});

test("does not silently merge distinct category names that generate the same slug", () => {
  const result = previewMenuImport([
    row({ category: "Chef & Table", slug: "first-conflict" }),
    row({ category: "Chef Table", name: "Second", slug: "second-conflict" }),
  ], [], []);
  assert.equal(result.rows[0].categoryClassification, "ERROR");
  assert.equal(result.rows[1].categoryClassification, "ERROR");
  assert.equal(result.newCategories.length, 0);
});

test("rejects overlong new category names instead of truncating them", () => {
  const result = previewMenuImport([row({ category: "A".repeat(161) })], [], []);
  assert.equal(result.rows[0].categoryClassification, "ERROR");
  assert.equal(result.newCategories.length, 0);
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
