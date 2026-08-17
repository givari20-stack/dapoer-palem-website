import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getAdminUser } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage() {
  const user = await getAdminUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <section aria-labelledby="admin-heading" className="max-w-4xl">
      <p className="text-xs font-semibold tracking-[0.2em] text-palem-green uppercase">
        Secure workspace
      </p>
      <h1 id="admin-heading" className="mt-3 font-serif text-4xl sm:text-5xl">
        Dapoer Palem Admin
      </h1>
      <p className="mt-5 max-w-2xl leading-7 text-dark-green/70">
        Welcome, {user.fullName}. Use the navigation to manage available CMS
        modules. Additional modules will be introduced in later milestones.
      </p>
    </section>
  );
}
