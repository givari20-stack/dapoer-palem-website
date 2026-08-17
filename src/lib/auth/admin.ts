import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export const appRoles = [
  "super_admin",
  "content_manager",
  "reservation_staff",
  "viewer",
] as const;

export type AppRole = (typeof appRoles)[number];

export type AdminUser = {
  id: string;
  email: string | null;
  fullName: string;
  role: AppRole;
};

function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && appRoles.includes(value as AppRole);
}

export const getAdminUser = cache(async (): Promise<AdminUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !isAppRole(profile.role)) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? null,
    fullName: profile.full_name,
    role: profile.role,
  };
});

export function canManageMedia(role: AppRole) {
  return role === "super_admin" || role === "content_manager";
}

export const canManageContent = canManageMedia;
