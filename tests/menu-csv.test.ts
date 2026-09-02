import assert from "node:assert/strict";
import test from "node:test";

import { createMenuCsv, menuCsvHeaders, parseMenuCsv, protectFormula, type MenuCsvRow } from "../src/lib/menu/csv.ts";

test("parses quoted CSV values and preserves embedded commas", () => {
  const csv = `${menuCsvHeaders.join(",")}\n"Test item",main,"Description, with comma",100,,SKU-1,,yes,available,draft,0,test-item`;
  const result = parseMenuCsv(csv);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.rows[0].description, "Description, with comma");
    assert.equal(result.rows[0].featured, "yes");
  }
});

test("rejects malformed and missing required headers", () => {
  assert.deepEqual(parseMenuCsv('name,category,price\n"broken'), { ok: false, message: "Malformed CSV: unclosed quoted value." });
  const missing = parseMenuCsv("name,category,price\nItem,main,10");
  assert.equal(missing.ok, false);
});

test("exports formula-like text as inert CSV data", () => {
  assert.equal(protectFormula("=1+1"), "'=1+1");
  const row = Object.fromEntries(menuCsvHeaders.map((header) => [header, ""])) as MenuCsvRow;
  row.name = "@unsafe";
  const csv = createMenuCsv([row]);
  assert.match(csv, /'@unsafe/);
});
