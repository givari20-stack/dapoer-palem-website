import { canManageContent, getAdminUser } from "@/lib/auth/admin";
import { createMenuCsv, menuCsvHeaders, type MenuCsvRow } from "@/lib/menu/csv";
import { fetchAll } from "@/lib/menu/server";
import { createClient } from "@/lib/supabase/server";

type ExportMenuItem = {
  name: string; category_id: string; description: string | null; price: number | string;
  original_price: number | string | null; sku: string | null; badge: string | null;
  featured: boolean; availability: string; status: string; display_order: number; slug: string;
};

export async function GET(request: Request) {
  const user = await getAdminUser();
  if (!user) return Response.json({ message: "Authentication required." }, { status: 401 });
  if (!canManageContent(user.role)) return Response.json({ message: "You do not have permission to export menu content." }, { status: 403 });
  const template = new URL(request.url).searchParams.get("template") === "1";
  if (template) return csvResponse(`${menuCsvHeaders.join(",")}\r\n`, "dapoer-palem-menu-template.csv");

  try {
    const supabase = await createClient();
    const [items, categories] = await Promise.all([
      fetchAll<ExportMenuItem>(supabase, "menu_items", "name,category_id,description,price,original_price,sku,badge,featured,availability,status,display_order,slug", "display_order"),
      fetchAll<{ id: string; name: string }>(supabase, "menu_categories", "id,name", "display_order"),
    ]);
    const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
    const rows: MenuCsvRow[] = items.map((item) => ({
      name: String(item.name ?? ""), category: categoryNames.get(item.category_id) ?? "", description: String(item.description ?? ""),
      price: String(item.price ?? ""), original_price: String(item.original_price ?? ""), sku: String(item.sku ?? ""), badge: String(item.badge ?? ""),
      featured: String(Boolean(item.featured)), availability: String(item.availability ?? ""), status: String(item.status ?? ""),
      display_order: String(item.display_order ?? 0), slug: String(item.slug ?? ""),
    }));
    return csvResponse(createMenuCsv(rows), "dapoer-palem-menu.csv");
  } catch {
    return Response.json({ message: "Menu export could not be generated." }, { status: 500 });
  }
}

function csvResponse(csv: string, fileName: string) {
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${fileName}"`, "x-content-type-options": "nosniff", "cache-control": "private, no-store" } });
}
