import { canManageContent, getAdminUser } from "@/lib/auth/admin";
import { previewMenuImport } from "@/lib/menu/import-validation";
import { loadMenuImportContext, readMenuRows } from "@/lib/menu/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const user = await getAdminUser();
  if (!user) return Response.json({ message: "Authentication required." }, { status: 401 });
  if (!canManageContent(user.role)) return Response.json({ message: "You do not have permission to import menu content." }, { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > 2_500_000) return Response.json({ message: "Import requests must be 2.5 MB or smaller." }, { status: 413 });

  let body: { rows?: unknown; importValidOnly?: unknown; allowUpdates?: unknown };
  try { body = await request.json(); } catch { return Response.json({ message: "Invalid import request." }, { status: 400 }); }
  const rows = readMenuRows(body.rows);
  if (!rows) return Response.json({ message: "Import must contain no more than 1,000 valid CSV-shaped rows." }, { status: 400 });
  const importValidOnly = body.importValidOnly === true;
  const allowUpdates = body.allowUpdates === true;
  const supabase = await createClient();

  try {
    const context = await loadMenuImportContext(supabase);
    const preview = previewMenuImport(rows, context.categories, context.existingItems);
    if (preview.summary.errors > 0 && !importValidOnly) {
      return Response.json({ message: "The import contains errors. Choose valid rows only or cancel the import.", preview }, { status: 409 });
    }
    const importRows = preview.rows
      .filter((row) => row.classification === "NEW" || (allowUpdates && row.classification === "UPDATE"))
      .map((row) => ({ id: row.existingId, expected_updated_at: row.expectedUpdatedAt, values: row.values }));
    if (!importRows.length) return Response.json({ message: "No confirmed menu rows are available to import.", preview }, { status: 400 });

    const { data, error } = await supabase.rpc("bulk_import_menu_items", { p_rows: importRows });
    if (error) {
      const conflict = error.message.includes("BULK_MENU_CONFLICT");
      return Response.json({ message: conflict ? "A menu item changed after preview. Preview the CSV again before importing." : "The menu import could not be completed. Confirm migration 008 is applied and try again." }, { status: conflict ? 409 : 400 });
    }
    return Response.json({ result: data, skipped: preview.summary.total - importRows.length });
  } catch {
    return Response.json({ message: "The menu import could not be prepared." }, { status: 500 });
  }
}
