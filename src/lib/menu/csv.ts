export const menuCsvHeaders = [
  "name",
  "category",
  "description",
  "price",
  "original_price",
  "sku",
  "badge",
  "featured",
  "availability",
  "status",
  "display_order",
  "slug",
] as const;

export type MenuCsvHeader = (typeof menuCsvHeaders)[number];
export type MenuCsvRow = Record<MenuCsvHeader, string>;

export type CsvParseResult =
  | { ok: true; rows: MenuCsvRow[] }
  | { ok: false; message: string };

const requiredHeaders = ["name", "category", "price", "slug"] as const;

export function parseMenuCsv(input: string): CsvParseResult {
  const parsed = parseCsv(input.replace(/^\uFEFF/, ""));
  if (!parsed.ok) return parsed;
  if (!parsed.rows.length) return { ok: false, message: "The CSV file is empty." };

  const headers = parsed.rows[0].map((header) => header.trim().toLocaleLowerCase());
  const duplicates = headers.filter((header, index) => headers.indexOf(header) !== index);
  if (duplicates.length) return { ok: false, message: `Duplicate CSV header: ${duplicates[0]}.` };

  const unsupported = headers.filter(
    (header) => !menuCsvHeaders.includes(header as MenuCsvHeader),
  );
  if (unsupported.length) return { ok: false, message: `Unsupported CSV header: ${unsupported[0]}.` };

  const missing = requiredHeaders.filter((header) => !headers.includes(header));
  if (missing.length) return { ok: false, message: `Missing required CSV header: ${missing[0]}.` };

  const rows = parsed.rows
    .slice(1)
    .filter((row) => row.some((cell) => cell.trim()))
    .map((row) => {
      const item = Object.fromEntries(menuCsvHeaders.map((header) => [header, ""])) as MenuCsvRow;
      headers.forEach((header, index) => {
        item[header as MenuCsvHeader] = row[index] ?? "";
      });
      return item;
    });

  return { ok: true, rows };
}

function parseCsv(input: string): { ok: true; rows: string[][] } | { ok: false; message: string } {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted) {
      if (character === '"' && input[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
      continue;
    }

    if (character === '"') {
      if (cell) return { ok: false, message: "Malformed CSV: unexpected quote." };
      quoted = true;
    } else if (character === ",") {
      row.push(cell);
      cell = "";
    } else if (character === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  if (quoted) return { ok: false, message: "Malformed CSV: unclosed quoted value." };
  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }
  return { ok: true, rows };
}

export function createMenuCsv(rows: MenuCsvRow[]) {
  return [
    menuCsvHeaders.join(","),
    ...rows.map((row) => menuCsvHeaders.map((header) => csvCell(row[header])).join(",")),
  ].join("\r\n");
}

function csvCell(value: string) {
  const protectedValue = protectFormula(value);
  return /[",\r\n]/.test(protectedValue)
    ? `"${protectedValue.replaceAll('"', '""')}"`
    : protectedValue;
}

export function protectFormula(value: string) {
  return /^[\t\r\n ]*[=+\-@]/.test(value) ? `'${value}` : value;
}
