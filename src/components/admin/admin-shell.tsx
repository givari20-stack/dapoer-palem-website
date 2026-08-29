import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import type { AdminUser } from "@/lib/auth/admin";
import { logout } from "@/app/admin/actions";

const navigation = [
  { label: "Dashboard", href: "/admin", enabled: true },
  { label: "Homepage", href: "/admin/homepage", enabled: true },
  { label: "About", href: "/admin/about", enabled: true },
  { label: "Menu", href: "/admin/menu", enabled: true },
  { label: "Promos", href: "/admin/promos", enabled: true },
  { label: "Events", href: "/admin/events", enabled: true },
  { label: "Gallery", href: "/admin/gallery", enabled: true },
  { label: "Media", href: "/admin/media", enabled: true },
  { label: "Reservations", href: "/admin/reservations", enabled: true },
  { label: "Settings", href: "/admin/settings", enabled: true },
  { label: "Activity", href: "/admin/activity", enabled: true },
] as const;

type AdminShellProps = {
  children: ReactNode;
  user: AdminUser;
};

export function AdminShell({ children, user }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-cream text-dark-green">
      <header className="border-b border-dark-green/10 bg-white">
        <div className="mx-auto flex min-h-20 max-w-[100rem] items-center justify-between gap-6 px-5 sm:px-8">
          <Link href="/admin" aria-label="Dapoer Palem admin dashboard">
            <Image
              src="/logo/dapoer-palem-black.png"
              alt="Dapoer Palem"
              width={178}
              height={60}
              className="h-auto w-32 sm:w-36"
              priority
            />
          </Link>
          <div className="flex min-w-0 items-center gap-4 text-right">
            <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user.fullName}</p>
            <p className="mt-0.5 text-[0.65rem] tracking-[0.14em] text-dark-green/55 uppercase">
              {user.role.replaceAll("_", " ")}
            </p>
            </div>
            <form action={logout}><button className="rounded-full border border-dark-green/15 px-3 py-2 text-[0.6rem] font-bold tracking-wide uppercase hover:bg-cream">Log out</button></form>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[100rem] lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="border-b border-dark-green/10 bg-white lg:min-h-[calc(100vh-5rem)] lg:border-r lg:border-b-0">
          <nav aria-label="Admin navigation" className="overflow-x-auto p-4 lg:p-6">
            <ul className="flex min-w-max gap-2 lg:min-w-0 lg:flex-col">
              {navigation.map((item) => (
                <li key={item.label}>
                  {item.enabled ? (
                    <Link
                      href={item.href}
                      className="block rounded-md px-4 py-3 text-sm font-semibold transition-colors hover:bg-cream focus-visible:outline-palem-green"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      aria-disabled="true"
                      className="block cursor-not-allowed rounded-md px-4 py-3 text-sm text-dark-green/40"
                    >
                      {item.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div className="min-w-0 p-5 sm:p-8 lg:p-10">{children}</div>
      </div>
    </div>
  );
}
