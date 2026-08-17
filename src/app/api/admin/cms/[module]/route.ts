import { NextResponse } from "next/server";

import { canManageMedia, getAdminUser } from "@/lib/auth/admin";
import { cmsModules, isCmsModuleKey } from "@/lib/cms/config";
import { validateCmsValues } from "@/lib/cms/validation";
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

  const submission = body as { id?: unknown; values?: unknown };
  const validation = validateCmsValues(module, submission.values);
  if (!validation.ok) {
    return NextResponse.json({ message: validation.message }, { status: 400 });
  }

  const config = cmsModules[module];
  const supabase = await createClient();
  const id = typeof submission.id === "string" ? submission.id : null;
  const slug = validation.values.slug;

  if (typeof slug === "string") {
    let uniquenessQuery = supabase.from(config.table).select("id").eq("slug", slug);
    if (id) uniquenessQuery = uniquenessQuery.neq("id", id);
    const { data: existing } = await uniquenessQuery.limit(1);
    if (existing?.length) {
      return NextResponse.json({ message: "That slug is already in use." }, { status: 409 });
    }
  }

  const query = id
    ? supabase.from(config.table).update(validation.values).eq("id", id)
    : supabase.from(config.table).insert(validation.values);
  const { data, error } = await query.select("*").single();

  if (error || !data) {
    return NextResponse.json({ message: "Content could not be saved. Please review the fields and try again." }, { status: 400 });
  }

  return NextResponse.json({ item: data });
}
