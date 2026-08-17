import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/layout/container";
import { ReservationForm } from "@/components/reservation/reservation-form";
import { getPublicSettings } from "@/lib/settings/public";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reservation", description: "Submit a reservation request to Dapoer Palem." };

export default async function ReservationPage() {
  const settings = await getPublicSettings();
  const enabled = settings.reservation_enabled?.toLowerCase() !== "false";
  return <><Navbar mode="solid" /><main className="bg-cream pb-28 pt-36 sm:pt-44"><Container><div className="mx-auto max-w-3xl"><p className="text-xs font-bold tracking-[0.22em] text-palem-green uppercase">Reservation</p><h1 className="mt-4 font-serif text-5xl font-semibold sm:text-7xl">Plan your visit.</h1><p className="mt-6 max-w-xl leading-8 text-dark-green/65">Send a reservation request using the form below.</p><div className="mt-12"><ReservationForm enabled={enabled} /></div></div></Container></main><Footer /></>;
}
