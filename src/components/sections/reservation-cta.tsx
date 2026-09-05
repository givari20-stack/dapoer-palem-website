import { Container } from "@/components/layout/container";
import { ButtonLink } from "@/components/ui/button";
import type { HomepageSectionContent } from "@/lib/public-content";

export function ReservationCta({ content }: { content?: HomepageSectionContent }) {
  return (
    <section
      aria-labelledby="reservation-title"
      className="relative isolate overflow-hidden bg-palem-green py-24 text-brand-white sm:py-32"
    >
      {content?.image_url ? <div aria-hidden="true" className="absolute inset-0 -z-30 bg-cover bg-center" style={{ backgroundImage: `url(${content.image_url})` }} /> : null}
      {content?.image_url ? <div aria-hidden="true" className="absolute inset-0 -z-20 bg-palem-green/85" /> : null}
      <div
        aria-hidden="true"
        className="absolute -left-32 top-1/2 -z-10 aspect-square w-96 -translate-y-1/2 rounded-full border border-brand-white/12 sm:w-[34rem]"
      />
      <Container className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-20">
        <div>
          <p className="mb-5 text-[0.6875rem] font-bold tracking-[0.24em] text-gold uppercase">
            {content?.eyebrow || "Plan your time"}
          </p>
          <h2
            id="reservation-title"
            className="max-w-4xl font-serif text-5xl leading-[0.9] font-semibold tracking-[-0.035em] sm:text-7xl lg:text-8xl"
          >
            {content?.heading ? content.heading : <><span>Make room for</span><span className="block italic text-cream">a shared table.</span></>}
          </h2>
          <p className="mt-8 max-w-xl text-sm leading-7 text-brand-white/70">
            {content?.description || "Reservation and contact details will be added when the official booking information is available."}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <ButtonLink
            href={content?.primary_button_url || "/reservation"}
            className="!border-brand-white !bg-brand-white !text-dark-green shadow-none hover:!border-cream hover:!bg-cream"
          >
            {content?.primary_button_label || "Reservation"}
          </ButtonLink>
          <ButtonLink
            href={content?.secondary_button_url || "/contact"}
            variant="ghost"
            className="border-brand-white/25 text-brand-white hover:border-brand-white/50 hover:bg-brand-white/10"
          >
            {content?.secondary_button_label || "Contact"}
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
