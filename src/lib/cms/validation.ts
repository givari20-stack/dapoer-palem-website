import { cmsModules, type CmsModuleKey } from "@/lib/cms/config";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type ValidationResult =
  | { ok: true; values: Record<string, unknown> }
  | { ok: false; message: string };

export function validateCmsValues(
  moduleKey: CmsModuleKey,
  input: unknown,
): ValidationResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, message: "Invalid form submission." };
  }

  const config = cmsModules[moduleKey];
  const source = input as Record<string, unknown>;
  const values: Record<string, unknown> = {};

  for (const field of config.fields) {
    const raw = source[field.name];

    if (field.kind === "repeatable") {
      let items: unknown = raw === null || raw === undefined || raw === "" ? [] : raw;
      if (typeof raw === "string") {
        try { items = JSON.parse(raw); } catch {
          return { ok: false, message: `${field.label} is invalid.` };
        }
      }
      if (!Array.isArray(items)) return { ok: false, message: `${field.label} must be a list.` };
      if (field.maxItems !== undefined && items.length > field.maxItems) {
        return { ok: false, message: `${field.label} supports up to ${field.maxItems} items.` };
      }
      const normalized: Record<string, string>[] = [];
      for (const [index, item] of items.entries()) {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
          return { ok: false, message: `${field.label} item ${index + 1} is invalid.` };
        }
        const sourceItem = item as Record<string, unknown>;
        const normalizedItem: Record<string, string> = {};
        for (const itemField of field.itemFields ?? []) {
          const rawItemValue = sourceItem[itemField.name];
          const text = typeof rawItemValue === "string" ? rawItemValue.trim() : "";
          if (itemField.required && !text) {
            return { ok: false, message: `${field.label} item ${index + 1} ${itemField.label.toLocaleLowerCase()} is required.` };
          }
          if (text && itemField.kind === "url" && !isSafeUrl(text)) {
            return { ok: false, message: `${field.label} item ${index + 1} URL must be relative or HTTPS.` };
          }
          if (text) normalizedItem[itemField.name] = text;
        }
        normalized.push(normalizedItem);
      }
      values[field.name] = normalized;
      continue;
    }

    if (field.kind === "checkbox") {
      values[field.name] = raw === true;
      continue;
    }

    if (field.kind === "number") {
      if (raw === null || raw === undefined || raw === "") {
        if (field.required) return { ok: false, message: `${field.label} is required.` };
        values[field.name] = null;
        continue;
      }
      const numberValue = typeof raw === "number" ? raw : Number(raw);
      if (!Number.isFinite(numberValue) || (field.min !== undefined && numberValue < field.min)) {
        return { ok: false, message: `${field.label} must be a valid non-negative number.` };
      }
      values[field.name] = numberValue;
      continue;
    }

    const text = typeof raw === "string" ? raw.trim() : "";
    if (field.required && !text) {
      return { ok: false, message: `${field.label} is required.` };
    }
    if (!text) {
      values[field.name] = null;
      continue;
    }
    if (field.maxLength !== undefined && text.length > field.maxLength) {
      return { ok: false, message: `${field.label} must be ${field.maxLength} characters or fewer.` };
    }

    if ((field.kind === "media" || field.kind === "relation") && !uuidPattern.test(text)) {
      return { ok: false, message: `${field.label} is invalid.` };
    }
    if (field.name === "slug" && !slugPattern.test(text)) {
      return { ok: false, message: "Slug must use lowercase letters, numbers, and hyphens only." };
    }
    if (field.options && !field.options.includes(text)) {
      return { ok: false, message: `${field.label} is invalid.` };
    }
    if (field.kind === "date" && Number.isNaN(Date.parse(`${text}T00:00:00Z`))) {
      return { ok: false, message: `${field.label} is invalid.` };
    }
    if (field.kind === "datetime-local" && Number.isNaN(Date.parse(text))) {
      return { ok: false, message: `${field.label} is invalid.` };
    }
    if (field.name.endsWith("_url") && !isSafeUrl(text)) {
      return { ok: false, message: `${field.label} must be a relative or HTTPS URL.` };
    }

    values[field.name] = field.kind === "datetime-local" ? new Date(text).toISOString() : text;
  }

  if (moduleKey === "promos") {
    const start = values.start_date as string | null;
    const end = values.end_date as string | null;
    if (start && end && Date.parse(end) < Date.parse(start)) {
      return { ok: false, message: "End date must be after the start date." };
    }
  }
  if (moduleKey === "events") {
    const start = values.start_time as string | null;
    const end = values.end_time as string | null;
    if (start && end && end < start) {
      return { ok: false, message: "End time must be after the start time." };
    }
  }

  return { ok: true, values };
}

function isSafeUrl(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
