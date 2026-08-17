export const reservationStatuses = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
] as const;

export type ReservationStatus = (typeof reservationStatuses)[number];

export type ReservationInput = {
  name: string;
  phone: string;
  reservation_date: string;
  reservation_time: string | null;
  guest_count: number;
  notes: string | null;
};

// Reservation dates are calendar values, not instants. Validate their numeric
// components directly so the result never depends on the server timezone.
export function isValidReservationDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12) return false;

  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day >= 1 && day <= daysInMonth[month - 1];
}

export function validateReservationInput(value: unknown):
  | { ok: true; data: ReservationInput }
  | { ok: false; error: string } {
  if (!value || typeof value !== "object") return { ok: false, error: "Please complete the reservation form." };
  const input = value as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const phone = typeof input.phone === "string" ? input.phone.trim() : "";
  const date = typeof input.reservation_date === "string" ? input.reservation_date : "";
  const time = typeof input.reservation_time === "string" ? input.reservation_time.trim() : "";
  const notes = typeof input.notes === "string" ? input.notes.trim() : "";
  const guests = typeof input.guest_count === "number" ? input.guest_count : Number(input.guest_count);

  if (!name || name.length > 120) return { ok: false, error: "Enter a name of 120 characters or fewer." };
  if (phone.length < 7 || phone.length > 30 || !/^[0-9+(). -]+$/.test(phone)) {
    return { ok: false, error: "Enter a valid phone number." };
  }
  if (!isValidReservationDate(date)) return { ok: false, error: "Select a valid reservation date." };
  const today = new Date();
  const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  if (date < localToday) return { ok: false, error: "Reservation date cannot be in the past." };
  if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return { ok: false, error: "Select a valid reservation time." };
  if (!Number.isInteger(guests) || guests < 1 || guests > 100) {
    return { ok: false, error: "Guest count must be a whole number between 1 and 100." };
  }
  if (notes.length > 1000) return { ok: false, error: "Notes must be 1,000 characters or fewer." };

  return { ok: true, data: { name, phone, reservation_date: date, reservation_time: time || null, guest_count: guests, notes: notes || null } };
}

export function isReservationStatus(value: unknown): value is ReservationStatus {
  return typeof value === "string" && reservationStatuses.includes(value as ReservationStatus);
}
