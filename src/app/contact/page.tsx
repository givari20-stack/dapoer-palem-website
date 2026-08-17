import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Location } from "@/components/sections/location";
import { getPublicSettings } from "@/lib/settings/public";
import { normalizeWhatsAppNumber } from "@/lib/settings/whatsapp";

export const dynamic="force-dynamic"; export const metadata:Metadata={title:"Contact"};
export default async function ContactPage(){const settings=await getPublicSettings();const whatsapp=normalizeWhatsAppNumber(settings.whatsapp_number);const contacts=[["Phone",settings.phone?`tel:${settings.phone.replace(/[^+\d]/g,"")}`:null,settings.phone],["Email",settings.email?`mailto:${settings.email}`:null,settings.email],["WhatsApp",whatsapp?`https://wa.me/${whatsapp}`:null,whatsapp?"Open WhatsApp":null]].filter((item):item is [string,string,string]=>Boolean(item[1]&&item[2]));return <><Navbar mode="solid"/><main className="pt-24"><section className="bg-dark-green py-24 text-white sm:py-32"><Container><p className="text-xs font-bold tracking-[0.22em] text-gold uppercase">Contact</p><h1 className="mt-4 font-serif text-5xl sm:text-7xl">Connect with Dapoer Palem.</h1>{contacts.length?<dl className="mt-10 grid gap-5 sm:grid-cols-3">{contacts.map(([label,href,text])=><div key={label}><dt className="text-xs font-bold tracking-wide text-gold uppercase">{label}</dt><dd className="mt-2"><a className="break-words text-cream underline-offset-4 hover:underline" href={href} target={label==="WhatsApp"?"_blank":undefined} rel={label==="WhatsApp"?"noreferrer":undefined}>{text}</a></dd></div>)}</dl>:<p className="mt-8 text-white/65">Official contact details have not been supplied yet.</p>}</Container></section><Location/></main><Footer/></>}
