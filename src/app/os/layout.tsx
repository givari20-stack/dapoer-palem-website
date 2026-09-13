import type { Metadata } from "next"; import { redirect } from "next/navigation"; import type { ReactNode } from "react";
import { OsShell } from "@/components/os/os-shell"; import { getAdminUser } from "@/lib/auth/admin"; import { getSupabaseEnvironment } from "@/lib/supabase/env";
export const dynamic="force-dynamic"; export const metadata:Metadata={title:"Dapoer Palem OS",robots:{index:false,follow:false,nocache:true}};
export default async function OsLayout({children}:{children:ReactNode}){if(!getSupabaseEnvironment())redirect('/login');const user=await getAdminUser();if(!user)redirect('/login');return <OsShell user={user}>{children}</OsShell>}
