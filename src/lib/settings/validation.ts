import { settingDefinitionMap, type SettingDefinition } from "./config";
import { normalizeWhatsAppNumber } from "./whatsapp";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

function safeUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch { return false; }
}

function validHours(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return false;
    return Object.values(parsed).every((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return false;
      const period = entry as Record<string, unknown>;
      if (period.closed === true) return Object.keys(period).every((key) => key === "closed");
      return typeof period.open === "string" && timePattern.test(period.open)
        && typeof period.close === "string" && timePattern.test(period.close)
        && Object.keys(period).every((key) => key === "open" || key === "close");
    });
  } catch { return false; }
}

function validateValue(definition: SettingDefinition, raw: unknown): { ok: true; value: string | null } | { ok: false; error: string } {
  if (definition.kind === "boolean") {
    if (typeof raw !== "boolean") return { ok: false, error: `${definition.label} must be true or false.` };
    return { ok: true, value: String(raw) };
  }
  if (typeof raw !== "string") return { ok: false, error: `${definition.label} must be text.` };
  const value = raw.trim();
  if (!value) return { ok: true, value: null };
  if (value.length > 4000) return { ok: false, error: `${definition.label} is too long.` };
  if (definition.kind === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return { ok: false, error: "Enter a valid email address." };
  if (definition.kind === "url" && !safeUrl(value)) return { ok: false, error: `${definition.label} must use http:// or https://.` };
  if (definition.kind === "whatsapp") {
    const normalized = normalizeWhatsAppNumber(value);
    return normalized ? { ok: true, value: normalized } : { ok: false, error: "Enter a valid WhatsApp number with 7–15 digits." };
  }
  if (definition.kind === "number") {
    const number = Number(value);
    const min = definition.key === "latitude" ? -90 : -180;
    const max = definition.key === "latitude" ? 90 : 180;
    if (!Number.isFinite(number) || number < min || number > max) return { ok: false, error: `${definition.label} must be between ${min} and ${max}.` };
    return { ok: true, value: String(number) };
  }
  if (definition.kind === "media" && !uuidPattern.test(value)) return { ok: false, error: `Select a valid ${definition.label.toLowerCase()}.` };
  if (definition.kind === "hours" && !validHours(value)) return { ok: false, error: "Opening hours must be valid structured JSON with 24-hour open/close times or a closed flag." };
  return { ok: true, value };
}

export function validateSettingsPayload(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false as const, error: "Invalid settings payload." };
  const entries: { key: string; value: string | null; group: SettingDefinition["group"] }[] = [];
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const definition = settingDefinitionMap.get(key);
    if (!definition) return { ok: false as const, error: "Unknown setting." };
    const result = validateValue(definition, raw);
    if (!result.ok) return { ok: false as const, error: result.error };
    entries.push({ key, value: result.value, group: definition.group });
  }
  return { ok: true as const, entries };
}
