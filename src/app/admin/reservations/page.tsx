import type { Metadata } from "next";
import { ReservationsManager, type ReservationRecord } from "@/components/admin/reservations-manager";
import { getAdminUser } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reservations", robots: { index: false, follow: false } };
export default async function AdminReservationsPage() {
  const user = await getAdminUser();
  if (!user || (user.role !== "super_admin" && user.role !== "reservation_staff")) return <section><h1 className="font-serif text-4xl">Reservations</h1><p role="alert" className="mt-6 rounded-md border border-gold/50 bg-white p-5">You do not have permission to access reservations.</p></section>;
  const supabase = await createClient();
  const [reservations, whatsapp] = await Promise.all([supabase.from("reservations").select("*").order("reservation_date"), supabase.from("site_settings").select("setting_value").eq("setting_key","whatsapp_number").eq("is_public",true).maybeSingle()]);
  if (reservations.error) return <p role="alert">Reservations could not be loaded.</p>;
  return <ReservationsManager initialReservations={(reservations.data ?? []) as ReservationRecord[]} whatsappNumber={whatsapp.data?.setting_value ?? undefined} />;
}
