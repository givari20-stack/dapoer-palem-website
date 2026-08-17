"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";

export function ReservationForm({ enabled }: { enabled: boolean }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true); setMessage(null); setWhatsappUrl(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/reservations", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"), phone: form.get("phone"), reservation_date: form.get("reservation_date"),
        reservation_time: form.get("reservation_time"), guest_count: Number(form.get("guest_count")), notes: form.get("notes"),
      }),
    });
    const body = await response.json() as { error?: string; whatsappUrl?: string | null };
    setPending(false);
    if (!response.ok) { setMessage(body.error ?? "Reservation could not be submitted."); return; }
    setMessage("Your reservation request has been submitted.");
    setWhatsappUrl(body.whatsappUrl ?? null);
    event.currentTarget.reset();
  }

  if (!enabled) return <p role="status" className="rounded-lg border border-gold/45 bg-white p-6 text-dark-green/75">Reservations are currently unavailable.</p>;

  const fieldClass = "mt-2 min-h-12 w-full rounded-md border border-dark-green/20 bg-white px-4 py-3 text-sm outline-none transition focus:border-palem-green focus:ring-2 focus:ring-palem-green/15";
  return (
    <form onSubmit={submit} className="grid gap-6" aria-busy={pending}>
      <div className="grid gap-6 sm:grid-cols-2">
        <label className="text-sm font-semibold">Name<input className={fieldClass} name="name" required maxLength={120} autoComplete="name" /></label>
        <label className="text-sm font-semibold">Phone<input className={fieldClass} name="phone" required minLength={7} maxLength={30} autoComplete="tel" inputMode="tel" /></label>
        <label className="text-sm font-semibold">Date<input className={fieldClass} name="reservation_date" type="date" required /></label>
        <label className="text-sm font-semibold">Time <span className="font-normal text-dark-green/55">(optional)</span><input className={fieldClass} name="reservation_time" type="time" /></label>
        <label className="text-sm font-semibold sm:col-span-2">Guest count<input className={fieldClass} name="guest_count" type="number" min={1} max={100} step={1} required inputMode="numeric" /></label>
        <label className="text-sm font-semibold sm:col-span-2">Notes <span className="font-normal text-dark-green/55">(optional)</span><textarea className={`${fieldClass} min-h-32 resize-y`} name="notes" maxLength={1000} /></label>
      </div>
      {message && <p role="status" aria-live="polite" className="rounded-md border border-palem-green/20 bg-white p-4 text-sm">{message}</p>}
      <div className="flex flex-wrap gap-4">
        <Button type="submit" disabled={pending}>{pending ? "Submitting…" : "Submit reservation"}</Button>
        {whatsappUrl && <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center rounded-full border border-dark-green/25 px-6 text-xs font-bold tracking-[0.12em] uppercase hover:bg-dark-green hover:text-white">Continue on WhatsApp</a>}
      </div>
    </form>
  );
}
