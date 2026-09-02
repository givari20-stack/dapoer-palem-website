import type { MenuCsvRow } from "./csv.ts";

export type MenuCategoryLookup = { id: string; name: string; slug: string };
export type ExistingMenuLookup = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  sku: string | null;
  updated_at: string;
};

export type ValidatedMenuValues = {
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  original_price: number | null;
  sku: string | null;
  badge: string | null;
  featured: boolean;
  availability: "available" | "unavailable";
  status: "draft" | "published" | "archived";
  display_order: number;
};

export type MenuImportClassification = "NEW" | "UPDATE" | "DUPLICATE" | "ERROR";
export type MenuImportPreviewRow = {
  rowNumber: number;
  source: MenuCsvRow;
  values: ValidatedMenuValues | null;
  classification: MenuImportClassification;
  errors: string[];
  warnings: string[];
  existingId: string | null;
  expectedUpdatedAt: string | null;
};

export function previewMenuImport(
  rows: MenuCsvRow[],
  categories: MenuCategoryLookup[],
  existingItems: ExistingMenuLookup[],
) {
  const categoryByName = new Map(categories.map((item) => [normalize(item.name), item]));
  const categoryBySlug = new Map(categories.map((item) => [normalize(item.slug), item]));
  const existingBySku = new Map(
    existingItems.filter((item) => item.sku).map((item) => [normalizeSku(item.sku!), item]),
  );
  const existingBySlug = new Map(existingItems.map((item) => [item.slug.toLocaleLowerCase(), item]));
  const existingByNameCategory = new Map(
    existingItems.map((item) => [`${normalize(item.name)}:${item.category_id}`, item]),
  );
  const seenSku = new Map<string, number>();
  const seenSlug = new Map<string, number>();
  const seenNameCategory = new Map<string, number>();

  const previewRows = rows.map((source, index): MenuImportPreviewRow => {
    const rowNumber = index + 2;
    const errors: string[] = [];
    const warnings: string[] = [];
    const name = limited(source.name, 160, "Name", true, errors);
    const categoryReference = source.category.trim();
    const category = categoryByName.get(normalize(categoryReference)) ?? categoryBySlug.get(normalize(categoryReference));
    if (!categoryReference) errors.push("Category is required.");
    else if (!category) errors.push(`Category “${safeLabel(categoryReference)}” was not found.`);
    const description = limited(source.description, 2000, "Description", false, errors);
    const price = numberValue(source.price, "Price", true, errors);
    const originalPrice = numberValue(source.original_price, "Original price", false, errors);
    const sku = source.sku.trim() ? limited(normalizeSku(source.sku), 100, "SKU", false, errors) : null;
    const badge = limited(source.badge, 80, "Badge", false, errors);
    const slug = limited(source.slug.toLocaleLowerCase(), 160, "Slug", true, errors);
    if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) errors.push("Slug must use lowercase letters, numbers, and hyphens only.");
    const featured = booleanValue(source.featured, errors);
    const availability = enumValue(source.availability || "available", ["available", "unavailable"] as const, "Availability", errors);
    const status = enumValue(source.status || "draft", ["draft", "published", "archived"] as const, "Status", errors);
    const displayOrder = integerValue(source.display_order || "0", errors);

    const values = errors.length || !category || name === null || slug === null || price === null || featured === null || !availability || !status || displayOrder === null
      ? null
      : { category_id: category.id, name, slug, description, price, original_price: originalPrice, sku, badge, featured, availability, status, display_order: displayOrder };

    if (!values) return { rowNumber, source, values: null, classification: "ERROR", errors, warnings, existingId: null, expectedUpdatedAt: null };

    const nameCategoryKey = `${normalize(values.name)}:${values.category_id}`;
    const duplicateRow = (values.sku ? seenSku.get(values.sku) : undefined) ?? seenSlug.get(values.slug) ?? seenNameCategory.get(nameCategoryKey);
    if (duplicateRow) {
      errors.push(`Duplicates CSV row ${duplicateRow} by SKU, slug, or normalized name and category.`);
      return { rowNumber, source, values, classification: "DUPLICATE", errors, warnings, existingId: null, expectedUpdatedAt: null };
    }
    if (values.sku) seenSku.set(values.sku, rowNumber);
    seenSlug.set(values.slug, rowNumber);
    seenNameCategory.set(nameCategoryKey, rowNumber);

    const skuMatch = values.sku ? existingBySku.get(values.sku) : undefined;
    const slugMatch = existingBySlug.get(values.slug);
    if (skuMatch && slugMatch && skuMatch.id !== slugMatch.id) {
      errors.push("SKU and slug match different existing menu items.");
      return { rowNumber, source, values, classification: "DUPLICATE", errors, warnings, existingId: null, expectedUpdatedAt: null };
    }
    const directMatch = skuMatch ?? slugMatch;
    if (directMatch) {
      warnings.push("Existing item will only be updated after explicit confirmation.");
      return { rowNumber, source, values, classification: "UPDATE", errors, warnings, existingId: directMatch.id, expectedUpdatedAt: directMatch.updated_at };
    }
    const nameMatch = existingByNameCategory.get(nameCategoryKey);
    if (nameMatch) {
      errors.push("An existing item has the same normalized name and category; provide its SKU or slug to update it explicitly.");
      return { rowNumber, source, values, classification: "DUPLICATE", errors, warnings, existingId: nameMatch.id, expectedUpdatedAt: nameMatch.updated_at };
    }
    return { rowNumber, source, values, classification: "NEW", errors, warnings, existingId: null, expectedUpdatedAt: null };
  });

  return {
    rows: previewRows,
    summary: {
      total: previewRows.length,
      valid: previewRows.filter((row) => row.classification === "NEW" || row.classification === "UPDATE").length,
      warnings: previewRows.filter((row) => row.warnings.length > 0).length,
      errors: previewRows.filter((row) => row.errors.length > 0).length,
      newRecords: previewRows.filter((row) => row.classification === "NEW").length,
      updates: previewRows.filter((row) => row.classification === "UPDATE").length,
      duplicates: previewRows.filter((row) => row.classification === "DUPLICATE").length,
    },
  };
}

export function normalizeSku(value: string) {
  return value.trim().replace(/\s+/g, "-").toLocaleUpperCase();
}

function normalize(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function safeLabel(value: string) {
  return value.replace(/[\r\n\t]/g, " ").slice(0, 80);
}

function limited(value: string, max: number, label: string, required: boolean, errors: string[]) {
  const trimmed = value.trim();
  if (required && !trimmed) errors.push(`${label} is required.`);
  if (trimmed.length > max) errors.push(`${label} must be ${max} characters or fewer.`);
  return trimmed ? trimmed.slice(0, max) : null;
}

function numberValue(value: string, label: string, required: boolean, errors: string[]) {
  const trimmed = value.trim();
  if (!trimmed) {
    if (required) errors.push(`${label} is required.`);
    return null;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    errors.push(`${label} must be a number greater than or equal to zero.`);
    return null;
  }
  return parsed;
}

function booleanValue(value: string, errors: string[]) {
  const normalized = value.trim().toLocaleLowerCase();
  if (["true", "yes", "1"].includes(normalized)) return true;
  if (["false", "no", "0", ""].includes(normalized)) return false;
  errors.push("Featured must be true, false, yes, no, 1, or 0.");
  return null;
}

function enumValue<const T extends readonly string[]>(value: string, allowed: T, label: string, errors: string[]): T[number] | null {
  const normalized = value.trim().toLocaleLowerCase();
  if (allowed.includes(normalized)) return normalized as T[number];
  errors.push(`${label} must be one of: ${allowed.join(", ")}.`);
  return null;
}

function integerValue(value: string, errors: string[]) {
  const parsed = Number(value.trim());
  if (!Number.isInteger(parsed) || parsed < 0) {
    errors.push("Display order must be a non-negative integer.");
    return null;
  }
  return parsed;
}
