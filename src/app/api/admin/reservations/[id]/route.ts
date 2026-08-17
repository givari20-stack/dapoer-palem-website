import { getAdminUser } from "@/lib/auth/admin";
import { isReservationStatus } from "@/lib/reservations/validation";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getAdminUser();
  if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });
  if (user.role !== "super_admin" && user.role !== "reservation_staff") {
    return Response.json({ error: "You do not have permission to manage reservations." }, { status: 403 });
  }
  let payload: unknown;
  try { payload = await request.json(); } catch { return Response.json({ error: "Invalid request." }, { status: 400 }); }
  const status = (payload as { status?: unknown })?.status;
  if (!isReservationStatus(status)) return Response.json({ error: "Invalid reservation status." }, { status: 400 });
  const { id } = await context.params;
  const supabase = await createClient();
  const { data, error } = await supabase.from("reservations").update({ status }).eq("id", id).select("*").single();
  if (error) return Response.json({ error: "The reservation could not be updated." }, { status: 400 });
  return Response.json({ reservation: data });
}
