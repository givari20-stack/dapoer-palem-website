import { NextResponse } from "next/server";

import { getAdminUser } from "@/lib/auth/admin";
import { isOsModule, osModules } from "@/lib/os/config";
import { validateOsValues } from "@/lib/os/validation";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ module: string }> }) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  const { module } = await params;
  if (!isOsModule(module)) return NextResponse.json({ message: "Unknown OS module." }, { status: 404 });
  const config = osModules[module];
  if (user.role === "viewer" || user.role === "reservation_staff" || (config.superAdminOnly && user.role !== "super_admin")) return NextResponse.json({ message: "You do not have permission to change this module." }, { status: 403 });

  let body: { id?: unknown; values?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ message: "Invalid submission." }, { status: 400 }); }
  const validation = validateOsValues(module, body.values);
  if (!validation.ok) return NextResponse.json({ message: validation.message }, { status: 400 });

  const supabase = await createClient();
  const id = typeof body.id === "string" ? body.id : null;
  const { team, role, ...validatedValues } = validation.values;
  const values = { ...validatedValues, ...(!id ? { created_by: user.id } : {}) };
  const query = id ? supabase.from(config.table).update(values).eq("id", id) : supabase.from(config.table).insert(values);
  const { data, error } = await query.select("*").single();
  if (error || !data) return NextResponse.json({ message: "The record could not be saved." }, { status: 400 });

  if (module === "projects") {
    const memberIds = Array.isArray(team) ? team as string[] : [];
    const { error: memberError } = await supabase.rpc("sync_os_project_members", { p_project_id: data.id, p_member_ids: memberIds });
    if (memberError) return NextResponse.json({ message: "The project was saved, but its team could not be synchronized." }, { status: 409 });
    return NextResponse.json({ item: { ...data, team: memberIds } });
  }
  if (module === "team") {
    const { error: roleError } = await supabase.rpc("set_os_team_member_role", { p_user_id: data.user_id, p_role: role });
    if (roleError) return NextResponse.json({ message: "The responsibility was saved, but the role change was rejected." }, { status: 409 });
    return NextResponse.json({ item: { ...data, role } });
  }
  return NextResponse.json({ item: data });
}
