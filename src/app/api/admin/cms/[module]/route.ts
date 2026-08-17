import { NextResponse } from "next/server";

import { canManageMedia, getAdminUser } from "@/lib/auth/admin";
import { cmsModules, isCmsModuleKey } from "@/lib/cms/config";
import { validateCmsValues } from "@/lib/cms/validation";
import { actionSummary, createCmsSnapshot } from "@/lib/cms/history";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ module: string }> };

export async function POST(request: Request, context: RouteContext) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  if (!canManageMedia(user.role)) {
    return NextResponse.json({ message: "You do not have permission to edit CMS content." }, { status: 403 });
  }

  const { module } = await context.params;
  if (!isCmsModuleKey(module)) {
    return NextResponse.json({ message: "Unknown CMS module." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid form submission." }, { status: 400 });
  }

  const submission = body as { id?: unknown; values?: unknown; intent?: unknown; expectedUpdatedAt?: unknown; changeSummary?: unknown };
  const validation = validateCmsValues(module, submission.values);
  if (!validation.ok) {
    return NextResponse.json({ message: validation.message }, { status: 400 });
  }

  const config = cmsModules[module];
  const supabase = await createClient();
  const id = typeof submission.id === "string" ? submission.id : null;
  const intent = typeof submission.intent === "string" ? submission.intent : id ? "update" : "create";
  if (!['create','update','save_draft','publish','archive'].includes(intent)) {
    return NextResponse.json({ message: "Invalid publishing action." }, { status: 400 });
  }
  if (config.statusField) {
    if (intent === "save_draft") validation.values.status = "draft";
    if (intent === "publish") validation.values.status = "published";
    if (intent === "archive") validation.values.status = "archived";
  }
  if (config.activeField && intent === "archive") validation.values.active = false;
  if (config.activeField && intent === "publish") validation.values.active = true;
  const slug = validation.values.slug;

  if (typeof slug === "string") {
    let uniquenessQuery = supabase.from(config.table).select("id").eq("slug", slug);
    if (id) uniquenessQuery = uniquenessQuery.neq("id", id);
    const { data: existing } = await uniquenessQuery.limit(1);
    if (existing?.length) {
      return NextResponse.json({ message: "That slug is already in use." }, { status: 409 });
    }
  }

  let query = id
    ? supabase.from(config.table).update(validation.values).eq("id", id)
    : supabase.from(config.table).insert(validation.values);
  if (id && typeof submission.expectedUpdatedAt === "string") {
    query = query.eq("updated_at", submission.expectedUpdatedAt);
  }
  const { data, error } = await query.select("*").single();

  if (error || !data) {
    return NextResponse.json({ message: id ? "This content changed after you opened it. Reload before saving." : "Content could not be saved. Please review the fields and try again." }, { status: id ? 409 : 400 });
  }

  const action = id ? intent : "create";
  const { error: revisionError } = await supabase.rpc("record_cms_revision", {
    p_entity_type: config.table,
    p_entity_id: data.id,
    p_snapshot: createCmsSnapshot(config, data),
    p_change_summary: actionSummary(action, config.singular, submission.changeSummary),
    p_action: action,
  });
  if (revisionError) {
    return NextResponse.json({ message: "Content was saved, but its revision history could not be recorded. Apply migration 006 and try again." }, { status: 500 });
  }

  return NextResponse.json({ item: data });
}
