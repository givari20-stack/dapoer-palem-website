import { canManageContent, getAdminUser } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const user = await getAdminUser();
  if (!user) return Response.json({ message: "Authentication required." }, { status: 401 });
  if (!canManageContent(user.role)) return Response.json({ message: "You do not have permission to bulk edit menu content." }, { status: 403 });
  let body: { ids?: unknown; changes?: unknown; intent?: unknown };
  try { body = await request.json(); } catch { return Response.json({ message: "Invalid bulk edit request." }, { status: 400 }); }
  const ids = Array.isArray(body.ids) ? [...new Set(body.ids)] : [];
  if (!ids.length || ids.length > 500 || ids.some((id) => typeof id !== "string" || !uuid.test(id))) return Response.json({ message: "Select between 1 and 500 valid menu items." }, { status: 400 });
  const intent = body.intent === "archive" || body.intent === "restore" ? body.intent : "update";
  const source = body.changes && typeof body.changes === "object" && !Array.isArray(body.changes) ? body.changes as Record<string, unknown> : {};
  const changes: Record<string, unknown> = {};
  if (intent === "archive") changes.status = "archived";
  if (intent === "restore") changes.status = "draft";
  if (intent === "update") {
    if (typeof source.category_id === "string" && uuid.test(source.category_id)) changes.category_id = source.category_id;
    if (typeof source.featured === "boolean") changes.featured = source.featured;
    if (source.availability === "available" || source.availability === "unavailable") changes.availability = source.availability;
    if (["draft", "published", "archived"].includes(String(source.status))) changes.status = source.status;
    if (Number.isInteger(source.display_order) && Number(source.display_order) >= 0) changes.display_order = source.display_order;
  }
  if (!Object.keys(changes).length) return Response.json({ message: "Choose at least one bulk field to change." }, { status: 400 });

  const supabase = await createClient();
  if (changes.category_id) {
    const { data } = await supabase.from("menu_categories").select("id").eq("id", changes.category_id).maybeSingle();
    if (!data) return Response.json({ message: "The selected category is unavailable." }, { status: 400 });
  }
  const { data, error } = await supabase.rpc("bulk_update_menu_items", { p_ids: ids, p_changes: changes, p_action: intent });
  if (error) return Response.json({ message: "Bulk menu changes could not be completed. Confirm migration 008 is applied and try again." }, { status: 400 });
  return Response.json({ result: data });
}
