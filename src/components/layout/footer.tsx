import Image from "next/image";
import Link from "next/link";

import { Container } from "./container";
import { getPublicSettings } from "@/lib/settings/public";

const footerNavigation = [
  {
    title: "Explore",
    links: [
      ["Menu", "/menu"],
      ["Promo", "/promo"],
      ["Event", "/event"],
      ["Gallery", "/gallery"],
    ],
  },
  {
    title: "Dapoer Palem",
    links: [
      ["About", "/about"],
      ["Reservation", "/reservation"],
      ["Contact", "/contact"],
    ],
  },
] as const;

export async function Footer() {
  const settings = await getPublicSettings();
  const socialLinks = [["Instagram", settings.instagram], ["TikTok", settings.tiktok], ["Facebook", settings.facebook]].filter((item): item is [string,string] => Boolean(item[1]));
  return (
    <footer className="bg-dark-green pb-8 pt-20 text-brand-white sm:pt-24">
      <Container>
        <div className="grid gap-14 border-b border-brand-white/12 pb-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-24">
          <div>
            <Link
              href="/"
              aria-label="Dapoer Palem home"
              className="inline-flex rounded-md focus-visible:outline-gold"
            >
              <Image
                src="/logo/dapoer-palem-white.png"
                alt="Dapoer Palem — Inspired by Nature"
                width={1600}
                height={1600}
                sizes="128px"
                className="h-28 w-28 object-contain sm:h-32 sm:w-32"
              />
            </Link>
            <p className="mt-7 max-w-md font-serif text-4xl leading-tight italic text-cream sm:text-5xl">
              Inspired by Nature.
            </p>
          </div>

          <div className="grid gap-10 sm:grid-cols-3">
            {footerNavigation.map((group) => (
              <div key={group.title}>
                <h2 className="text-[0.625rem] font-bold tracking-[0.2em] text-gold uppercase">
                  {group.title}
                </h2>
                <ul className="mt-6 space-y-4">
                  {group.links.map(([label, href]) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="text-sm text-brand-white/72 transition-colors hover:text-brand-white"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div>
              <h2 className="text-[0.625rem] font-bold tracking-[0.2em] text-gold uppercase">
                Connect
              </h2>
              {socialLinks.length ? <ul className="mt-6 space-y-4">{socialLinks.map(([label,href])=><li key={label}><a href={href} target="_blank" rel="noreferrer" className="text-sm text-brand-white/72 transition-colors hover:text-brand-white">{label}</a></li>)}</ul> : <p className="mt-6 text-sm leading-7 text-brand-white/55">Contact and social details will be added when supplied.</p>}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-7 text-[0.625rem] font-semibold tracking-[0.12em] text-brand-white/45 uppercase sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Dapoer Palem</p>
          <p>Official website foundation</p>
        </div>
      </Container>
    </footer>
  );
}
