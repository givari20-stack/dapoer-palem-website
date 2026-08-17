import type { Metadata } from "next";
import { SettingsManager } from "@/components/admin/settings-manager";
import { getAdminUser } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic="force-dynamic"; export const metadata:Metadata={title:"Website settings",robots:{index:false,follow:false}};
export default async function SettingsPage(){const user=await getAdminUser();if(!user||user.role==="reservation_staff")return <section><h1 className="font-serif text-4xl">Website settings</h1><p role="alert" className="mt-6 rounded-md border border-gold/50 bg-white p-5">You do not have permission to access website settings.</p></section>;const supabase=await createClient();const [settings,media]=await Promise.all([supabase.from("site_settings").select("setting_key,setting_value"),supabase.from("media").select("id,file_name").eq("active",true).order("file_name")]);const values=Object.fromEntries((settings.data??[]).map((item)=>[item.setting_key,item.setting_value??""]));return <SettingsManager initialValues={values} media={media.data??[]} editable={user.role==="super_admin"}/>}
