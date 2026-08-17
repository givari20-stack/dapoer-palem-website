import { buildWhatsAppUrl } from "@/lib/settings/whatsapp";
import { validateReservationInput } from "@/lib/reservations/validation";
import { getPublicSettings } from "@/lib/settings/public";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  let payload: unknown;
  try { payload = await request.json(); } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const result = validateReservationInput(payload);
  if (!result.ok) return Response.json({ error: result.error }, { status: 400 });

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_reservation", {
    p_name: result.data.name,
    p_phone: result.data.phone,
    p_reservation_date: result.data.reservation_date,
    p_reservation_time: result.data.reservation_time,
    p_guest_count: result.data.guest_count,
    p_notes: result.data.notes,
  });
  if (error) {
    const disabled = error.message.includes("RESERVATIONS_DISABLED");
    return Response.json(
      { error: disabled ? "Reservations are currently unavailable." : "We could not submit your reservation. Please try again." },
      { status: disabled ? 409 : 500 },
    );
  }
  const settings = await getPublicSettings();
  return Response.json({ ok: true, whatsappUrl: buildWhatsAppUrl(settings.whatsapp_number, result.data) });
}
