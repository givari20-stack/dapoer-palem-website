import { Container } from "@/components/layout/container";
import { ButtonLink } from "@/components/ui/button";
import { EditorialVisual } from "@/components/ui/editorial-visual";
import type { PublicAboutContent } from "@/lib/public-content";

export type AboutContact = {
  brandName: string;
  tagline: string;
  address?: string;
  mapsUrl?: string;
  phone?: string;
  email?: string;
  whatsappUrl?: string;
  openingHours: { day: string; hours: string }[];
};

export function AboutPresentation({ content, contact }: { content: PublicAboutContent | null; contact: AboutContact }) {
  if (!content) {
    return <main className="overflow-hidden bg-cream pt-28 text-dark-green sm:pt-32"><section className="py-24 sm:py-32"><Container><div className="rounded-lg border border-dashed border-dark-green/20 bg-white px-6 py-16 text-center shadow-soft sm:py-20"><p className="text-xs font-bold tracking-[0.2em] text-palem-green uppercase">{contact.tagline}</p><h1 className="mt-4 font-serif text-4xl sm:text-5xl">Kisah {contact.brandName} sedang disiapkan.</h1><p className="mx-auto mt-5 max-w-xl leading-8 text-dark-green/60">Konten yang telah diterbitkan akan tampil di halaman ini.</p></div></Container></section></main>;
  }

  const overviewParagraphs = paragraphs(content.supporting_text);
  const hasIdentity = Boolean(content.brand_identity_heading || content.brand_identity_description || content.brand_identity_values.length);
  const hasContact = Boolean(contact.address || contact.phone || contact.email || contact.whatsappUrl || contact.openingHours.length);

  return (
    <main className="overflow-hidden bg-cream pt-28 text-dark-green sm:pt-32">
      <section className="border-b border-dark-green/10 py-20 sm:py-28 lg:py-32"><Container><p className="flex items-center gap-4 text-xs font-bold tracking-[0.22em] text-palem-green uppercase"><span aria-hidden="true" className="h-px w-8 bg-gold" />{content.eyebrow || "Tentang Kami"}</p><h1 className="mt-5 max-w-5xl font-serif text-6xl leading-[0.9] font-semibold tracking-[-0.04em] sm:text-8xl lg:text-9xl">{content.heading}</h1>{content.description ? <p className="mt-8 max-w-3xl text-base leading-8 text-dark-green/68 sm:text-lg sm:leading-9">{content.description}</p> : null}</Container></section>

      {content.overview_heading || overviewParagraphs.length ? <section aria-labelledby="about-overview-title" className="py-24 sm:py-32 lg:py-40"><Container className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-24"><p className="text-xs font-bold tracking-[0.22em] text-palem-green uppercase">{contact.tagline}</p><div>{content.overview_heading ? <h2 id="about-overview-title" className="font-serif text-5xl leading-[0.95] font-semibold tracking-[-0.035em] sm:text-7xl">{content.overview_heading}</h2> : null}{overviewParagraphs.length ? <div className="mt-9 space-y-5 border-t border-dark-green/12 pt-8 text-base leading-8 text-dark-green/68 sm:text-lg sm:leading-9">{overviewParagraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div> : null}</div></Container></section> : null}

      {content.story_heading || content.story_description ? <section className="border-t border-dark-green/10 py-24 sm:py-32"><Container><EditorialText eyebrow="Cerita" heading={content.story_heading} description={content.story_description} /></Container></section> : null}

      <section className="pb-24 sm:pb-32 lg:pb-40"><Container>{content.image_url ? <AboutImage src={content.image_url} alt={content.image_alt || contact.brandName} className="aspect-[16/9] w-full rounded-lg object-cover shadow-soft" /> : <EditorialVisual label={`${contact.brandName} about`} className="min-h-[24rem] rounded-lg sm:min-h-[34rem]" />}</Container></section>

      {content.founder_heading || content.founder_name || content.founder_role || content.founder_description || content.founder_image_url ? <section aria-labelledby="about-founder-title" className="py-24 sm:py-32 lg:py-40"><Container className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">{content.founder_image_url ? <AboutImage src={content.founder_image_url} alt={content.founder_image_alt || content.founder_name || contact.brandName} className="aspect-[4/5] w-full rounded-lg object-cover shadow-soft" /> : <EditorialVisual label={content.founder_name || "Founder"} className="aspect-[4/5] rounded-lg" />}<div>{content.founder_role ? <p className="text-xs font-bold tracking-[0.22em] text-palem-green uppercase">{content.founder_role}</p> : null}{content.founder_heading ? <h2 id="about-founder-title" className="mt-4 font-serif text-5xl leading-none sm:text-7xl">{content.founder_heading}</h2> : null}{content.founder_name ? <p className="mt-6 font-serif text-3xl text-palem-green">{content.founder_name}</p> : null}{content.founder_description ? <div className="mt-7 space-y-5 text-base leading-8 text-dark-green/68">{paragraphs(content.founder_description).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div> : null}</div></Container></section> : null}

      {content.vision_heading || content.vision_description ? <section aria-labelledby="about-vision-title" className="bg-dark-green py-24 text-brand-white sm:py-32"><Container className="grid gap-8 lg:grid-cols-[0.55fr_1.45fr] lg:gap-20"><p className="text-xs font-bold tracking-[0.22em] text-gold uppercase">Visi</p><div>{content.vision_heading ? <h2 id="about-vision-title" className="font-serif text-5xl leading-none text-cream sm:text-7xl">{content.vision_heading}</h2> : null}{content.vision_description ? <p className="mt-8 max-w-3xl text-base leading-8 text-brand-white/72 sm:text-lg">{content.vision_description}</p> : null}</div></Container></section> : null}

      {content.mission_heading || content.mission_items.length ? <section aria-labelledby="about-mission-title" className="bg-brand-white py-24 sm:py-32 lg:py-40"><Container><p className="text-xs font-bold tracking-[0.22em] text-palem-green uppercase">Misi</p>{content.mission_heading ? <h2 id="about-mission-title" className="mt-4 max-w-4xl font-serif text-5xl leading-none sm:text-7xl">{content.mission_heading}</h2> : null}{content.mission_items.length ? <ol className="mt-14 grid gap-px bg-dark-green/12 sm:grid-cols-2 lg:grid-cols-3">{content.mission_items.map((item, index) => <li key={`${item.name}-${index}`} className="bg-brand-white p-7 sm:p-9"><p className="text-xs font-bold text-gold">{String(index + 1).padStart(2, "0")}</p><h3 className="mt-5 font-serif text-3xl">{item.name}</h3><p className="mt-4 text-sm leading-7 text-dark-green/65">{item.description}</p></li>)}</ol> : null}</Container></section> : null}

      {content.business_concept_heading || content.business_concept_description || content.business_concept_items.length ? <section className="py-24 sm:py-32"><Container><EditorialText eyebrow="Konsep Usaha" heading={content.business_concept_heading} description={content.business_concept_description} />{content.business_concept_items.length ? <CompactItems items={content.business_concept_items} /> : null}</Container></section> : null}

      {hasIdentity ? <section className="bg-brand-white py-24 sm:py-32"><Container><EditorialText heading={content.brand_identity_heading} description={content.brand_identity_description} eyebrow="Identitas Brand" />{content.brand_identity_values.length ? <CompactItems items={content.brand_identity_values} /> : null}</Container></section> : null}

      {content.audience_heading || content.audience_description || content.audience_items.length ? <section className="py-24 sm:py-32"><Container><EditorialText heading={content.audience_heading} description={content.audience_description} eyebrow="Target Pelanggan" />{content.audience_items.length ? <CompactItems items={content.audience_items} /> : null}</Container></section> : null}

      {content.offerings_heading || content.offerings_items.length ? <ItemSection eyebrow="Produk dan Penawaran" heading={content.offerings_heading} items={content.offerings_items} /> : null}
      {content.journey_heading || content.journey_items.length ? <ItemSection eyebrow="Perjalanan Brand" heading={content.journey_heading} items={content.journey_items} /> : null}
      {content.operations_heading || content.operations_description ? <section className="bg-brand-white py-24 sm:py-32"><Container><EditorialText eyebrow="Operasional" heading={content.operations_heading} description={content.operations_description} /></Container></section> : null}
      {content.production_flow_heading || content.production_flow_items.length ? <FlowSection eyebrow="Alur Produksi" heading={content.production_flow_heading} items={content.production_flow_items} /> : null}
      {content.customer_flow_heading || content.customer_flow_items.length ? <FlowSection eyebrow="Alur Produk hingga Customer" heading={content.customer_flow_heading} items={content.customer_flow_items} /> : null}
      {content.location_heading || content.location_description ? <section className="bg-brand-white py-24 sm:py-32"><Container><EditorialText eyebrow="Lokasi dan Operasional" heading={content.location_heading} description={content.location_description} /></Container></section> : null}
      {content.service_channels_heading || content.service_channels_items.length ? <ItemSection eyebrow="Cara Menikmati" heading={content.service_channels_heading} items={content.service_channels_items} links /> : null}

      {content.cta_label && content.cta_url ? <section className="bg-palem-green py-20 text-brand-white sm:py-24"><Container className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-2xl font-serif text-4xl leading-tight text-cream sm:text-5xl">{content.overview_heading || content.heading}</p><ButtonLink href={content.cta_url} className="!border-brand-white !bg-brand-white !text-dark-green shadow-none hover:!bg-cream">{content.cta_label}</ButtonLink></Container></section> : null}
      {hasContact ? <ContactSection contact={contact} /> : null}
    </main>
  );
}

function EditorialText({ eyebrow, heading, description }: { eyebrow: string; heading: string | null; description: string | null }) {
  if (!heading && !description) return null;
  return <article><p className="text-xs font-bold tracking-[0.22em] text-palem-green uppercase">{eyebrow}</p>{heading ? <h2 className="mt-4 font-serif text-5xl leading-none sm:text-6xl">{heading}</h2> : null}{description ? <div className="mt-7 space-y-5 text-base leading-8 text-dark-green/68">{paragraphs(description).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div> : null}</article>;
}

function ItemSection({ eyebrow, heading, items, links = false }: { eyebrow: string; heading: string | null; items: PublicAboutContent["offerings_items"]; links?: boolean }) {
  return <section className="border-t border-dark-green/10 py-24 sm:py-32"><Container><p className="text-xs font-bold tracking-[0.22em] text-palem-green uppercase">{eyebrow}</p>{heading ? <h2 className="mt-4 max-w-4xl font-serif text-5xl leading-none sm:text-7xl">{heading}</h2> : null}{items.length ? <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{items.map((item, index) => <article key={`${item.name}-${index}`} className="rounded-lg border border-dark-green/10 bg-white p-7"><h3 className="font-serif text-3xl">{item.name}</h3><p className="mt-4 text-sm leading-7 text-dark-green/65">{item.description}</p>{links && item.url ? <ButtonLink href={item.url} variant="ghost" className="mt-5 -ml-6">{item.name}<span aria-hidden="true" className="ml-2 text-gold">↗</span></ButtonLink> : null}</article>)}</div> : null}</Container></section>;
}

function CompactItems({ items }: { items: PublicAboutContent["offerings_items"] }) {
  return <div className="mt-10 grid gap-px bg-dark-green/12 sm:grid-cols-2 lg:grid-cols-3">{items.map((item, index) => <article key={`${item.name}-${index}`} className="bg-cream p-7"><h3 className="font-serif text-3xl">{item.name}</h3>{item.description ? <p className="mt-3 text-sm leading-7 text-dark-green/65">{item.description}</p> : null}</article>)}</div>;
}

function FlowSection({ eyebrow, heading, items }: { eyebrow: string; heading: string | null; items: PublicAboutContent["production_flow_items"] }) {
  const visible = items.filter((item) => item.active !== false).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return <section className="bg-dark-green py-24 text-brand-white sm:py-32"><Container><p className="text-xs font-bold tracking-[0.22em] text-gold uppercase">{eyebrow}</p>{heading ? <h2 className="mt-4 max-w-4xl font-serif text-5xl leading-none text-cream sm:text-7xl">{heading}</h2> : null}{visible.length ? <ol className="mt-12 grid gap-5 lg:grid-cols-4">{visible.map((item, index) => <li key={`${item.name}-${index}`} className="border-t border-brand-white/20 pt-5"><p className="text-xs font-bold text-gold">{String(index + 1).padStart(2, "0")}</p><h3 className="mt-4 font-serif text-2xl">{item.name}</h3>{item.role ? <p className="mt-2 text-[0.65rem] font-bold tracking-wide text-gold uppercase">{item.role}</p> : null}<p className="mt-3 text-sm leading-7 text-brand-white/65">{item.description}</p></li>)}</ol> : null}</Container></section>;
}

function ContactSection({ contact }: { contact: AboutContact }) {
  const links = [contact.phone ? { label: "Telepon", href: `tel:${contact.phone.replace(/[^+\d]/g, "")}`, text: contact.phone } : null, contact.email ? { label: "Email", href: `mailto:${contact.email}`, text: contact.email } : null, contact.whatsappUrl ? { label: "WhatsApp", href: contact.whatsappUrl, text: "Hubungi melalui WhatsApp", external: true } : null, contact.mapsUrl ? { label: "Lokasi", href: contact.mapsUrl, text: "Buka Google Maps", external: true } : null].filter((item): item is NonNullable<typeof item> => Boolean(item));
  return <section aria-labelledby="about-contact-title" className="bg-dark-green py-24 text-brand-white sm:py-32"><Container><p className="text-xs font-bold tracking-[0.22em] text-gold uppercase">Kontak</p><h2 id="about-contact-title" className="mt-4 font-serif text-5xl leading-none text-cream sm:text-7xl">Terhubung dengan {contact.brandName}.</h2><div className="mt-12 grid gap-10 lg:grid-cols-3">{contact.address ? <div><h3 className="text-xs font-bold tracking-wide text-gold uppercase">Alamat</h3><p className="mt-4 text-sm leading-7 text-brand-white/70">{contact.address}</p></div> : null}{links.length ? <ul className="space-y-4">{links.map((item) => <li key={item.label}><a href={item.href} target={item.external ? "_blank" : undefined} rel={item.external ? "noreferrer" : undefined} className="text-sm text-brand-white/75 underline-offset-4 hover:underline">{item.text}</a></li>)}</ul> : null}{contact.openingHours.length ? <dl className="space-y-2 text-sm">{contact.openingHours.map((item) => <div key={item.day} className="flex justify-between gap-5"><dt className="font-semibold">{item.day}</dt><dd className="text-brand-white/65">{item.hours}</dd></div>)}</dl> : null}</div></Container></section>;
}

function AboutImage({ src, alt, className }: { src: string; alt: string; className: string }) {
  // Signed private Media Library URLs are intentionally not optimized.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} />;
}

function paragraphs(value: string | null) {
  return value?.split(/\r?\n\s*\r?\n/).map((item) => item.trim()).filter(Boolean) ?? [];
}
