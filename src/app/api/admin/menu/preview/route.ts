import { canManageContent, getAdminUser } from "@/lib/auth/admin";
import { previewMenuImport } from "@/lib/menu/import-validation";
import { loadMenuImportContext, readMenuRows } from "@/lib/menu/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const user = await getAdminUser();
  if (!user) return Response.json({ message: "Authentication required." }, { status: 401 });
  if (!canManageContent(user.role)) return Response.json({ message: "You do not have permission to import menu content." }, { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > 2_500_000) return Response.json({ message: "Import requests must be 2.5 MB or smaller." }, { status: 413 });

  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ message: "Invalid import request." }, { status: 400 }); }
  const rows = readMenuRows((body as { rows?: unknown })?.rows);
  if (!rows) return Response.json({ message: "Import must contain no more than 1,000 valid CSV-shaped rows." }, { status: 400 });

  try {
    const context = await loadMenuImportContext(await createClient());
    return Response.json(previewMenuImport(rows, context.categories, context.existingItems));
  } catch {
    return Response.json({ message: "Menu import references could not be loaded." }, { status: 500 });
  }
}
