import { getAdminUser } from "@/lib/auth/admin";
import { validateSettingsPayload } from "@/lib/settings/validation";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const user = await getAdminUser();
  if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });
  if (user.role !== "super_admin") return Response.json({ error: "Only a super administrator can update settings." }, { status: 403 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return Response.json({ error: "Invalid request." }, { status: 400 }); }
  const result = validateSettingsPayload(payload);
  if (!result.ok) return Response.json({ error: result.error }, { status: 400 });
  const supabase = await createClient();
  const rows = result.entries.map((entry) => ({ setting_key: entry.key, setting_value: entry.value, setting_group: entry.group, is_public: true, updated_by: user.id }));
  const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "setting_key" });
  if (error) return Response.json({ error: "Settings could not be saved." }, { status: 400 });
  return Response.json({ ok: true });
}
