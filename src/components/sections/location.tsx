import { Container } from "@/components/layout/container";
import { Button, ButtonLink } from "@/components/ui/button";
import type { HomepageSectionContent } from "@/lib/public-content";
import { getPublicSettings, parseOpeningHours } from "@/lib/settings/public";

export async function Location({ content }: { content?: HomepageSectionContent }) {
  const settings = await getPublicSettings();
  const hours = parseOpeningHours(settings.opening_hours);
  const hasPrimaryCta = Boolean(content?.primary_button_label && content.primary_button_url);
  const hasSecondaryCta = Boolean(content?.secondary_button_label && content.secondary_button_url);
  return (
    <section id="location" aria-labelledby="location-title" className="bg-cream py-24 sm:py-32 lg:py-40">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:items-center lg:gap-20">
          <div>
            <p className="mb-5 text-[0.6875rem] font-bold tracking-[0.24em] text-palem-green uppercase">
              {content?.eyebrow || "Location"}
            </p>
            <h2
              id="location-title"
              className="font-serif text-5xl leading-[0.95] font-semibold tracking-[-0.03em] text-dark-green sm:text-6xl"
            >
              {content?.heading ? content.heading : <><span>Find your way</span><span className="block italic text-palem-green">to Dapoer Palem.</span></>}
            </h2>
            <p className="mt-7 max-w-md text-base leading-8 text-dark-green/68">
              {content?.description || settings.address || "Official location information has not been supplied yet."}
            </p>
            {content?.description && settings.address ? <p className="mt-4 max-w-md text-sm leading-7 text-dark-green/62">{settings.address}</p> : null}
            {hours.length > 0 && <dl className="mt-6 space-y-2 text-sm">{hours.map((item)=><div key={item.day} className="flex max-w-sm justify-between gap-6"><dt className="font-semibold">{item.day}</dt><dd className="text-dark-green/65">{item.hours}</dd></div>)}</dl>}
            <div className="mt-9 flex flex-wrap gap-3">
              {hasPrimaryCta ? <ButtonLink href={content!.primary_button_url!}>{content!.primary_button_label}</ButtonLink> : null}
              {hasSecondaryCta ? <ButtonLink href={content!.secondary_button_url!} variant="secondary">{content!.secondary_button_label}</ButtonLink> : null}
              {settings.google_maps_url ? <ButtonLink href={settings.google_maps_url} target="_blank" rel="noreferrer" variant="secondary">Get directions</ButtonLink> : <Button disabled variant="secondary">Directions unavailable</Button>}
            </div>
          </div>

          <div
            role="img"
            aria-label={content?.image_alt || (settings.address ? `Location map placeholder for ${settings.address}` : "Map placeholder; official location has not yet been supplied")}
            className="relative min-h-[28rem] overflow-hidden border border-dark-green/12 bg-brand-white bg-cover bg-center sm:min-h-[36rem]"
            style={content?.image_url ? { backgroundImage: `url(${content.image_url})` } : undefined}
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,rgb(1_58_20_/_0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgb(1_58_20_/_0.16)_1px,transparent_1px)] [background-size:3rem_3rem]"
            />
            <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
              <div className="flex aspect-square w-44 items-center justify-center rounded-full border border-gold/55 bg-cream shadow-[var(--shadow-soft)]">
                <div>
                  <p className="font-serif text-2xl font-semibold text-dark-green">Map</p>
                  <p className="mt-1 text-[0.5625rem] font-bold tracking-[0.14em] text-dark-green/45 uppercase">
                    {settings.address ? "Location" : "To be added"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
