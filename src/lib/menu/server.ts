import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { MenuCsvRow } from "./csv";
import type { ExistingMenuLookup, MenuCategoryLookup } from "./import-validation";

const maxRows = 1000;

export function readMenuRows(input: unknown): MenuCsvRow[] | null {
  if (!Array.isArray(input) || input.length > maxRows) return null;
  const headers = ["name", "category", "description", "price", "original_price", "sku", "badge", "featured", "availability", "status", "display_order", "slug"] as const;
  const rows: MenuCsvRow[] = [];
  let totalCharacters = 0;
  for (const item of input) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const source = item as Record<string, unknown>;
    const row = {} as MenuCsvRow;
    for (const header of headers) {
      if (typeof source[header] !== "string") return null;
      totalCharacters += source[header].length;
      if (source[header].length > 10_000 || totalCharacters > 2_000_000) return null;
      row[header] = source[header] as string;
    }
    rows.push(row);
  }
  return rows;
}

export async function loadMenuImportContext(supabase: SupabaseClient) {
  const [categories, existingItems] = await Promise.all([
    fetchAll<MenuCategoryLookup>(supabase, "menu_categories", "id,name,slug", "name"),
    fetchAll<ExistingMenuLookup>(supabase, "menu_items", "id,category_id,name,slug,sku,updated_at", "created_at"),
  ]);
  return { categories, existingItems };
}

export async function fetchAll<T>(
  supabase: SupabaseClient,
  table: string,
  columns: string,
  orderColumn: string,
): Promise<T[]> {
  const pageSize = 500;
  const records: T[] = [];
  for (let start = 0; start < 5000; start += pageSize) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order(orderColumn)
      .range(start, start + pageSize - 1);
    if (error) throw new Error(`Unable to load ${table}.`);
    records.push(...((data ?? []) as T[]));
    if ((data ?? []).length < pageSize) return records;
  }
  throw new Error(`The ${table} dataset exceeds the supported export limit.`);
}
