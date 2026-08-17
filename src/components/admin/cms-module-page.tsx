import { redirect } from "next/navigation";

import {
  CmsManager,
  type CmsOption,
  type CmsRecord,
} from "@/components/admin/cms-manager";
import { canManageContent, getAdminUser } from "@/lib/auth/admin";
import { cmsModules, type CmsModuleKey } from "@/lib/cms/config";
import { createClient } from "@/lib/supabase/server";

type CmsModulePageProps = {
  moduleKeys: CmsModuleKey[];
  title: string;
  description: string;
  includeCategories?: boolean;
};

export async function CmsModulePage({
  moduleKeys,
  title,
  description,
  includeCategories = false,
}: CmsModulePageProps) {
  const user = await getAdminUser();
  if (!user) redirect("/login");
  if (user.role === "reservation_staff") {
    return <PermissionMessage title={title} />;
  }

  const supabase = await createClient();
  const [moduleResults, mediaResult, categoryResult] = await Promise.all([
    Promise.all(
      moduleKeys.map(async (key) => {
        const config = cmsModules[key];
        const { data, error } = await supabase
          .from(config.table)
          .select("*")
          .order("created_at", { ascending: false });
        return { key, data: (data ?? []) as CmsRecord[], error };
      }),
    ),
    supabase
      .from("media")
      .select("id,file_name,title,storage_path,active")
      .eq("active", true)
      .order("created_at", { ascending: false }),
    includeCategories
      ? supabase
          .from("menu_categories")
          .select("id,name")
          .order("display_order", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (moduleResults.some((result) => result.error)) {
    return (
      <section>
        <h1 className="font-serif text-4xl sm:text-5xl">{title}</h1>
        <p role="alert" className="mt-6 rounded-md border border-red-900/20 bg-white p-5 text-red-900">
          CMS content could not be loaded. Please try again.
        </p>
      </section>
    );
  }

  const mediaRows = mediaResult.data ?? [];
  const signed = mediaRows.length
    ? await supabase.storage
        .from("media")
        .createSignedUrls(mediaRows.map((item) => item.storage_path), 600)
    : { data: [] };
  const signedByPath = new Map(
    (signed.data ?? []).map((item) => [item.path, item.signedUrl]),
  );
  const mediaOptions: CmsOption[] = mediaRows.map((item) => ({
    value: item.id,
    label: item.title || item.file_name,
    previewUrl: signedByPath.get(item.storage_path) ?? null,
  }));
  const relationOptions = {
    categories: ((categoryResult.data ?? []) as { id: string; name: string }[]).map(
      (item) => ({ value: item.id, label: item.name }),
    ),
  };

  return (
    <div>
      <header>
        <p className="text-xs font-bold tracking-[0.2em] text-palem-green uppercase">
          Content management
        </p>
        <h1 className="mt-2 font-serif text-4xl sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-3xl leading-7 text-dark-green/65">{description}</p>
      </header>
      <div className="mt-8 grid gap-8">
        {moduleResults.map((result) => (
          <CmsManager
            key={result.key}
            config={cmsModules[result.key]}
            initialItems={result.data}
            mediaOptions={mediaOptions}
            relationOptions={relationOptions}
            readOnly={!canManageContent(user.role)}
          />
        ))}
      </div>
    </div>
  );
}

function PermissionMessage({ title }: { title: string }) {
  return (
    <section>
      <h1 className="font-serif text-4xl sm:text-5xl">{title}</h1>
      <p role="alert" className="mt-6 rounded-md border border-gold/40 bg-white p-5">
        You do not have permission to access CMS content.
      </p>
    </section>
  );
}
