import { NextResponse } from "next/server";
import { canManageContent, getAdminUser } from "@/lib/auth/admin";
import { actionSummary, createCmsSnapshot } from "@/lib/cms/history";
import { cmsModules, isCmsModuleKey } from "@/lib/cms/config";
import { validateCmsValues } from "@/lib/cms/validation";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, context: { params: Promise<{ module: string; id: string }> }) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  if (!canManageContent(user.role)) return NextResponse.json({ message: "You do not have permission to restore content." }, { status: 403 });
  const { module, id } = await context.params;
  if (!isCmsModuleKey(module)) return NextResponse.json({ message: "Unknown CMS module." }, { status: 404 });
  let body: { revisionId?: unknown; expectedUpdatedAt?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ message: "Invalid restore request." }, { status: 400 }); }
  if (typeof body.revisionId !== "string" || typeof body.expectedUpdatedAt !== "string") return NextResponse.json({ message: "Invalid restore request." }, { status: 400 });
  const config = cmsModules[module];
  const supabase = await createClient();
  const { data: revision } = await supabase.from("content_revisions").select("id,version,snapshot").eq("id", body.revisionId).eq("entity_type", config.table).eq("entity_id", id).maybeSingle();
  if (!revision) return NextResponse.json({ message: "Revision unavailable." }, { status: 404 });
  const validation = validateCmsValues(module, revision.snapshot);
  if (!validation.ok) return NextResponse.json({ message: "This revision is no longer structurally valid." }, { status: 400 });
  if (config.statusField) validation.values.status = "draft";
  if (config.activeField) validation.values.active = true;
  const { data, error } = await supabase.from(config.table).update(validation.values).eq("id", id).eq("updated_at", body.expectedUpdatedAt).select("*").single();
  if (error || !data) return NextResponse.json({ message: "This content changed after the history page loaded. Reload before restoring." }, { status: 409 });
  const { error: historyError } = await supabase.rpc("record_cms_revision", { p_entity_type: config.table, p_entity_id: id, p_snapshot: createCmsSnapshot(config, data), p_change_summary: actionSummary("restore", config.singular, `Restored v${revision.version} as draft`), p_action: "restore" });
  if (historyError) return NextResponse.json({ message: "Restore completed, but revision history could not be recorded." }, { status: 500 });
  return NextResponse.json({ item: data });
}
