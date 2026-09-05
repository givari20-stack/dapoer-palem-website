import { Container } from "@/components/layout/container";
import { ButtonLink } from "@/components/ui/button";
import type { HomepageSectionContent } from "@/lib/public-content";

export function Hero({ content }: { content?: HomepageSectionContent }) {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[100svh] items-end overflow-hidden bg-dark-green pb-16 pt-36 text-brand-white sm:pb-20 sm:pt-44 lg:items-center lg:pb-24 lg:pt-40"
    >
      {/* Replace this decorative layer with approved hero imagery when supplied. */}
      <div
        data-image-slot="homepage-hero"
        aria-hidden="true"
        className="absolute inset-0 -z-30 bg-dark-green bg-cover bg-center"
        style={content?.image_url ? { backgroundImage: `url(${content.image_url})` } : undefined}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_82%_18%,rgb(212_175_55_/_0.16),transparent_27%),radial-gradient(circle_at_8%_90%,rgb(2_108_32_/_0.88),transparent_35%),linear-gradient(90deg,rgb(1_58_20_/_0.12),rgb(1_58_20_/_0.72))]"
      />
      <div
        aria-hidden="true"
        className="hero-orbit absolute -right-44 top-[14%] -z-10 aspect-square w-[30rem] rounded-full border border-brand-white/10 sm:-right-24 sm:w-[42rem] lg:right-[4vw] lg:top-1/2 lg:w-[48rem] lg:-translate-y-1/2"
      />
      <div
        aria-hidden="true"
        className="absolute right-6 top-[22%] -z-10 aspect-square w-72 rounded-full border border-gold/25 sm:right-20 sm:w-[32rem] lg:right-[13vw] lg:top-1/2 lg:-translate-y-1/2"
      />

      <Container className="grid items-end gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-24">
        <div className="max-w-4xl">
          <p className="mb-5 flex items-center gap-4 text-[0.6875rem] font-bold tracking-[0.28em] text-gold uppercase sm:mb-7">
            <span className="h-px w-9 bg-gold" aria-hidden="true" />
            {content?.eyebrow || "Dapoer Palem"}
          </p>
          <h1
            id="hero-title"
            className="font-serif text-[clamp(4.5rem,12vw,10rem)] leading-[0.78] font-medium tracking-[-0.05em]"
          >
            {content?.heading ? (
              content.heading
            ) : (
              <>
                Inspired
                <span className="mt-2 block pl-[0.1em] italic text-cream sm:mt-4">
                  by Nature.
                </span>
              </>
            )}
          </h1>
          {content?.description ? <p className="mt-9 max-w-xl text-base leading-8 text-brand-white/75 sm:mt-12 sm:text-lg sm:leading-9">{content.description}</p> : null}
          <div className="mt-9 flex flex-col gap-3 sm:mt-11 sm:flex-row sm:items-center">
            <ButtonLink href={content?.primary_button_url || "/menu"}>
              {content?.primary_button_label || "Explore Menu"}
            </ButtonLink>
            <ButtonLink
              href={content?.secondary_button_url || "/reservation"}
              variant="ghost"
              className="border-brand-white/25 text-brand-white hover:border-brand-white/50 hover:bg-brand-white/10"
            >
              {content?.secondary_button_label || "Reservation"}
              <span aria-hidden="true" className="ml-3 text-gold">
                ↗
              </span>
            </ButtonLink>
          </div>
        </div>

        <div className="hidden border-l border-brand-white/15 pl-8 lg:block">
          <p className="text-[0.625rem] font-bold tracking-[0.22em] text-gold uppercase">
            Homepage introduction
          </p>
          <p className="mt-4 font-serif text-2xl leading-snug italic text-cream">
            Food, gathering, atmosphere, and nature in one calm visual story.
          </p>
        </div>
      </Container>
    </section>
  );
}
