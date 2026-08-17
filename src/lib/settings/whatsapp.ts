import type { ReservationInput } from "@/lib/reservations/validation";

export function normalizeWhatsAppNumber(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!/^[+0-9(). -]+$/.test(trimmed)) return null;
  const digits = trimmed.replace(/\D/g, "");
  return /^\d{7,15}$/.test(digits) ? digits : null;
}

export function buildWhatsAppUrl(number: string | null | undefined, reservation: ReservationInput) {
  const target = normalizeWhatsAppNumber(number);
  if (!target) return null;
  const lines = [
    "Dapoer Palem Reservation",
    `Name: ${reservation.name}`,
    `Date: ${reservation.reservation_date}`,
    `Time: ${reservation.reservation_time || "Not specified"}`,
    `Guests: ${reservation.guest_count}`,
  ];
  if (reservation.notes) lines.push(`Notes: ${reservation.notes}`);
  return `https://wa.me/${target}?text=${encodeURIComponent(lines.join("\n"))}`;
}
