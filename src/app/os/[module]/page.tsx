import { notFound } from "next/navigation";

import { OsManager } from "@/components/os/os-manager";
import { getAdminUser } from "@/lib/auth/admin";
import { isOsModule, osModules } from "@/lib/os/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OsModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  if (!isOsModule(module)) notFound();
  const user = await getAdminUser();
  if (!user) notFound();
  if (user.role === "reservation_staff") return <Denied />;

  const config = osModules[module];
  const supabase = await createClient();
  const [rows, projects, tasks, campaigns, profiles, media, memberships] = await Promise.all([
    supabase.from(config.table).select("*").order("created_at", { ascending: false }),
    supabase.from("os_projects").select("id,name,public_id"),
    supabase.from("os_tasks").select("id,title,public_id").is("parent_task_id", null),
    supabase.from("os_campaigns").select("id,campaign_name"),
    supabase.from("profiles").select("id,full_name,role"),
    supabase.from("media").select("id,title,file_name").eq("active", true),
    supabase.from("os_project_members").select("project_id,user_id"),
  ]);
  const relations = {
    projects: (projects.data || []).map((item) => ({ value: item.id, label: `${item.public_id} · ${item.name}` })),
    tasks: (tasks.data || []).map((item) => ({ value: item.id, label: `${item.public_id} · ${item.title}` })),
    campaigns: (campaigns.data || []).map((item) => ({ value: item.id, label: item.campaign_name })),
    profiles: (profiles.data || []).map((item) => ({ value: item.id, label: `${item.full_name} · ${item.role.replaceAll("_", " ")}` })),
    media: (media.data || []).map((item) => ({ value: item.id, label: item.title || item.file_name })),
  };
  const projectTeams = new Map<string, string[]>();
  for (const membership of memberships.data || []) projectTeams.set(membership.project_id, [...(projectTeams.get(membership.project_id) || []), membership.user_id]);
  const profileRoles = new Map((profiles.data || []).map((profile) => [profile.id, profile.role]));
  const initialRows = (rows.data || []).map((row) => ({ ...row, ...(module === "projects" ? { team: projectTeams.get(row.id) || [] } : {}), ...(module === "team" ? { role: profileRoles.get(row.user_id) || "viewer" } : {}) })) as (Record<string, unknown> & { id: string })[];
  const canEdit = user.role === "super_admin" || (user.role === "content_manager" && !config.superAdminOnly);

  return <section><p className="text-xs font-bold tracking-[0.2em] text-palem-green uppercase">Dapoer Palem OS</p><h1 className="mt-2 font-serif text-4xl sm:text-5xl">{config.title}</h1><p className="mt-4 max-w-3xl text-dark-green/65">{config.description}</p>{rows.error ? <p role="alert" className="mt-8 rounded-lg border border-gold/30 bg-white p-6">Module database is not available. Apply the OS migration first.</p> : <div className="mt-8"><OsManager config={config} initialRows={initialRows} relations={relations} canEdit={canEdit} /></div>}</section>;
}

function Denied() {
  return <p role="alert" className="rounded-lg border border-gold/30 bg-white p-6">This module is not available for your role.</p>;
}
