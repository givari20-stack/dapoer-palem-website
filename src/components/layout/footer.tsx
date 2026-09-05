import Image from "next/image";
import Link from "next/link";

import { Container } from "./container";
import { getPublicSettings, parseOpeningHours } from "@/lib/settings/public";
import { normalizeWhatsAppNumber } from "@/lib/settings/whatsapp";

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
  const brandName = settings.brand_name || "Dapoer Palem";
  const tagline = settings.tagline || "Inspired by Nature.";
  const whatsapp = normalizeWhatsAppNumber(settings.whatsapp_number);
  const hours = parseOpeningHours(settings.opening_hours);
  const socialLinks = [["Instagram", settings.instagram], ["TikTok", settings.tiktok], ["Facebook", settings.facebook]].filter((item): item is [string,string] => Boolean(item[1]));
  const contactLinks = [
    ["Phone", settings.phone ? `tel:${settings.phone.replace(/[^+\d]/g, "")}` : null, settings.phone],
    ["Email", settings.email ? `mailto:${settings.email}` : null, settings.email],
    ["WhatsApp", whatsapp ? `https://wa.me/${whatsapp}` : null, whatsapp ? "WhatsApp" : null],
  ].filter((item): item is [string, string, string] => Boolean(item[1] && item[2]));
  return (
    <footer className="bg-dark-green pb-8 pt-20 text-brand-white sm:pt-24">
      <Container>
        <div className="grid gap-14 border-b border-brand-white/12 pb-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-24">
          <div>
            <Link
              href="/"
              aria-label={`${brandName} home`}
              className="inline-flex rounded-md focus-visible:outline-gold"
            >
              <Image
                src="/logo/dapoer-palem-white.png"
                alt={`${brandName} — ${tagline}`}
                width={1600}
                height={1600}
                sizes="128px"
                className="h-28 w-28 object-contain sm:h-32 sm:w-32"
              />
            </Link>
            <p className="mt-7 max-w-md font-serif text-4xl leading-tight italic text-cream sm:text-5xl">
              {tagline}
            </p>
            {settings.address ? <p className="mt-6 max-w-sm text-sm leading-7 text-brand-white/65">{settings.address}</p> : null}
            {hours.length ? <dl className="mt-5 max-w-sm space-y-1 text-xs text-brand-white/55">{hours.map((item)=><div key={item.day} className="flex justify-between gap-4"><dt>{item.day}</dt><dd>{item.hours}</dd></div>)}</dl> : null}
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
              {contactLinks.length || socialLinks.length ? <ul className="mt-6 space-y-4">{contactLinks.map(([label,href,text])=><li key={label}><a href={href} target={label === "WhatsApp" ? "_blank" : undefined} rel={label === "WhatsApp" ? "noreferrer" : undefined} className="text-sm text-brand-white/72 transition-colors hover:text-brand-white">{text}</a></li>)}{socialLinks.map(([label,href])=><li key={label}><a href={href} target="_blank" rel="noreferrer" className="text-sm text-brand-white/72 transition-colors hover:text-brand-white">{label}</a></li>)}</ul> : <p className="mt-6 text-sm leading-7 text-brand-white/55">Contact details are not available.</p>}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-7 text-[0.625rem] font-semibold tracking-[0.12em] text-brand-white/45 uppercase sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {brandName}</p>
          <p>{tagline}</p>
        </div>
      </Container>
    </footer>
  );
}
