"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function logout() {
  const supabase = await createClient();
  await supabase.rpc("record_auth_activity", { p_action: "logout" });
  await supabase.auth.signOut();
  redirect("/login");
}
