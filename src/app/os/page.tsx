import Link from "next/link";

import { getAdminUser } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OsDashboard() {
  const user = await getAdminUser();
  const supabase = await createClient();
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const nextWeek = new Date(today);
  nextWeek.setUTCDate(nextWeek.getUTCDate() + 7);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  if (user?.role === "reservation_staff") {
    const reservations = await supabase.from("reservations").select("*", { count: "exact", head: true }).in("status", ["pending", "confirmed"]);
    return <DashboardFrame name={user.fullName}><Metrics cards={[{ label: "Open reservations", count: reservations.error ? null : reservations.count }]} /></DashboardFrame>;
  }

  const [projects, campaigns, tasks, content, events, reservations, activity, reports] = await Promise.all([
    supabase.from("os_projects").select("*", { count: "exact", head: true }).in("status", ["planning", "active", "review"]),
    supabase.from("os_campaigns").select("*", { count: "exact", head: true }).in("status", ["planning", "preparation", "execution", "monitoring"]),
    supabase.from("os_tasks").select("*", { count: "exact", head: true }).gte("deadline", todayKey).lte("deadline", nextWeek.toISOString().slice(0, 10)).not("status", "in", "(completed,cancelled)"),
    supabase.from("os_content_items").select("*", { count: "exact", head: true }).gte("publish_at", today.toISOString()).lt("publish_at", tomorrow.toISOString()),
    supabase.from("events").select("*", { count: "exact", head: true }).eq("status", "published").gte("event_date", todayKey),
    supabase.from("reservations").select("*", { count: "exact", head: true }).in("status", ["pending", "confirmed"]),
    supabase.from("audit_logs").select("id,action,entity_type,created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("os_reports").select("id,title,status,created_at").order("created_at", { ascending: false }).limit(5),
  ]);
  const cards = [
    { label: "Active projects", count: projects.error ? null : projects.count },
    { label: "Active campaigns", count: campaigns.error ? null : campaigns.count },
    { label: "Tasks due soon", count: tasks.error ? null : tasks.count },
    { label: "Content today", count: content.error ? null : content.count },
    { label: "Upcoming events", count: events.error ? null : events.count },
    { label: "Open reservations", count: reservations.error ? null : reservations.count },
  ];

  return <DashboardFrame name={user?.fullName || "Team"}><Metrics cards={cards} /><div className="mt-8 grid gap-6 xl:grid-cols-3"><Feed title="Recent activity" rows={(activity.data || []).map((item) => `${item.action} · ${item.entity_type || "record"}`)} empty="No visible activity yet." /><Feed title="Recent reports" rows={(reports.data || []).map((item) => `${item.title} · ${item.status}`)} empty="No reports yet." /><article className="rounded-lg border border-dark-green/10 bg-white p-6"><p className="text-xs font-bold tracking-wide text-palem-green uppercase">Performance snapshot</p><p className="mt-5 text-sm leading-7 text-dark-green/60">Sales, reach, engagement, and promotion performance remain unavailable until verified data sources are connected.</p><Link href="/os/analytics" className="mt-5 inline-block text-xs font-bold text-palem-green uppercase">Open analytics</Link></article></div></DashboardFrame>;
}

function DashboardFrame({ name, children }: { name: string; children: React.ReactNode }) {
  return <section><p className="text-xs font-bold tracking-[0.2em] text-palem-green uppercase">Operational overview</p><h1 className="mt-2 font-serif text-4xl sm:text-5xl">Selamat datang, {name}.</h1><p className="mt-4 max-w-2xl text-dark-green/65">Ringkasan ini hanya menampilkan data aktual yang tersedia dan diizinkan untuk peran Anda.</p>{children}</section>;
}

function Metrics({ cards }: { cards: { label: string; count: number | null }[] }) {
  return <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map((card) => <article key={card.label} className="rounded-lg border border-dark-green/10 bg-white p-6"><p className="text-xs font-bold tracking-wide text-palem-green uppercase">{card.label}</p><p className="mt-4 font-serif text-5xl">{card.count ?? "—"}</p>{card.count === null ? <p className="mt-2 text-xs text-dark-green/45">Data unavailable</p> : null}</article>)}</div>;
}

function Feed({ title, rows, empty }: { title: string; rows: string[]; empty: string }) {
  return <article className="rounded-lg border border-dark-green/10 bg-white p-6"><p className="text-xs font-bold tracking-wide text-palem-green uppercase">{title}</p>{rows.length ? <ul className="mt-5 space-y-3 text-sm text-dark-green/65">{rows.map((row, index) => <li key={`${row}-${index}`} className="border-t border-dark-green/10 pt-3">{row}</li>)}</ul> : <p className="mt-5 text-sm text-dark-green/50">{empty}</p>}</article>;
}
