import { Container } from "@/components/layout/container";
import { ButtonLink } from "@/components/ui/button";
import type { HomepageSectionContent } from "@/lib/public-content";

export function MenuCta({ content }: { content?: HomepageSectionContent }) {
  const hasSecondaryCta = Boolean(content?.secondary_button_label && content.secondary_button_url);
  return (
    <section
      aria-labelledby="menu-title"
      className="relative overflow-hidden bg-dark-green bg-cover bg-center py-24 text-brand-white sm:py-32 lg:py-40"
      style={content?.image_url ? { backgroundImage: `url(${content.image_url})` } : undefined}
    >
      {content?.image_url ? <div aria-hidden="true" className="absolute inset-0 bg-dark-green/85" /> : null}
      <div
        aria-hidden="true"
        className="absolute -right-40 top-1/2 aspect-square w-[34rem] -translate-y-1/2 rounded-full border border-brand-white/10 sm:w-[46rem]"
      />
      <Container className="relative grid gap-12 lg:grid-cols-[1.25fr_0.75fr] lg:items-end lg:gap-24">
        <div>
          <p className="mb-5 text-[0.6875rem] font-bold tracking-[0.24em] text-gold uppercase">
            {content?.eyebrow || "From the kitchen"}
          </p>
          <h2
            id="menu-title"
            className="font-serif text-[clamp(4.5rem,10vw,9rem)] leading-[0.8] font-medium tracking-[-0.05em]"
          >
            {content?.heading ? content.heading : <><span>At the</span><span className="block pl-[0.12em] italic text-cream">table.</span></>}
          </h2>
        </div>
        <div className="border-t border-brand-white/15 pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
          {content?.description ? <p className="max-w-md text-base leading-8 text-brand-white/70">{content.description}</p> : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={content?.primary_button_url || "/menu"}>{content?.primary_button_label || "Explore Menu"}</ButtonLink>
            {hasSecondaryCta ? <ButtonLink href={content!.secondary_button_url!} variant="ghost" className="border-brand-white/25 text-brand-white hover:border-brand-white/50 hover:bg-brand-white/10">{content!.secondary_button_label}</ButtonLink> : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
