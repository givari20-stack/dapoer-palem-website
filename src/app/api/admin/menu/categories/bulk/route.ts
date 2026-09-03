import { canManageContent, getAdminUser } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const user = await getAdminUser();
  if (!user) return Response.json({ message: "Authentication required." }, { status: 401 });
  if (!canManageContent(user.role)) return Response.json({ message: "You do not have permission to manage categories." }, { status: 403 });
  let body: { ids?: unknown; intent?: unknown; displayOrder?: unknown };
  try { body = await request.json(); } catch { return Response.json({ message: "Invalid category bulk request." }, { status: 400 }); }
  const ids = Array.isArray(body.ids) ? [...new Set(body.ids)] : [];
  if (!ids.length || ids.length > 500 || ids.some((id) => typeof id !== "string" || !uuid.test(id))) return Response.json({ message: "Select between 1 and 500 valid categories." }, { status: 400 });
  const intent = body.intent;
  if (intent !== "archive" && intent !== "restore" && intent !== "reorder") return Response.json({ message: "Invalid category bulk action." }, { status: 400 });
  const displayOrder = Number(body.displayOrder);
  if (intent === "reorder" && (!Number.isInteger(displayOrder) || displayOrder < 0)) return Response.json({ message: "Display order must be a non-negative integer." }, { status: 400 });
  const { data, error } = await (await createClient()).rpc("bulk_update_menu_categories", { p_ids: ids, p_action: intent, p_display_order: intent === "reorder" ? displayOrder : null });
  if (error) return Response.json({ message: "Category changes could not be completed. Confirm migration 009 is applied and try again." }, { status: 400 });
  return Response.json({ result: data });
}
