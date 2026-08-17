import type { CmsModuleConfig } from "./config";

export function createCmsSnapshot(config: CmsModuleConfig, record: Record<string, unknown>) {
  const snapshot: Record<string, unknown> = {};
  for (const field of config.fields) snapshot[field.name] = record[field.name] ?? null;
  if (config.statusField) snapshot.status = record.status;
  if (config.activeField) snapshot.active = record.active;
  return snapshot;
}

export function actionSummary(action: string, singular: string, custom?: unknown) {
  if (typeof custom === "string" && custom.trim()) return custom.trim().slice(0, 240);
  const labels: Record<string, string> = {
    create: `Created ${singular}`,
    update: `Updated ${singular}`,
    save_draft: `Saved ${singular} draft`,
    publish: `Published ${singular}`,
    archive: `Archived ${singular}`,
    restore: `Restored ${singular} as draft`,
  };
  return labels[action] ?? `Updated ${singular}`;
}
