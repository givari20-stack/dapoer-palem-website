import { Container } from "@/components/layout/container";
import { ButtonLink } from "@/components/ui/button";
import type { HomepageSectionContent } from "@/lib/public-content";

export function Intro({ content }: { content?: HomepageSectionContent }) {
  const hasPrimaryCta = Boolean(content?.primary_button_label && content.primary_button_url);
  const hasSecondaryCta = Boolean(content?.secondary_button_label && content.secondary_button_url);

  return (
    <section
      aria-labelledby="intro-title"
      className="relative bg-cream bg-cover bg-center py-24 sm:py-32 lg:py-40"
      style={content?.image_url ? { backgroundImage: `url(${content.image_url})` } : undefined}
    >
      {content?.image_url ? <div aria-hidden="true" className="absolute inset-0 bg-cream/90" /> : null}
      <Container className="relative">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-24">
          <div>
            <p className="flex items-center gap-4 text-[0.6875rem] font-bold tracking-[0.24em] text-palem-green uppercase">
              <span className="h-px w-8 bg-gold" aria-hidden="true" />
              {content?.eyebrow || "Welcome"}
            </p>
          </div>
          <div>
            <h2
              id="intro-title"
              className="max-w-4xl font-serif text-5xl leading-[0.95] font-semibold tracking-[-0.035em] text-dark-green sm:text-6xl lg:text-7xl"
            >
              {content?.heading ? content.heading : <><span>A place for food,</span><span className="block italic text-palem-green">conversation, and connection.</span></>}
            </h2>
            {content?.description || hasPrimaryCta || hasSecondaryCta ? <div className="mt-10 grid gap-6 border-t border-dark-green/12 pt-8 sm:grid-cols-[1fr_auto] sm:gap-12">
              {content?.description ? <p className="max-w-2xl text-base leading-8 text-dark-green/70 sm:text-lg sm:leading-9">{content.description}</p> : <span />}
              {hasPrimaryCta || hasSecondaryCta ? (
                <div className="flex flex-wrap gap-3 sm:justify-end">
                  {hasPrimaryCta ? <ButtonLink href={content!.primary_button_url!}>{content!.primary_button_label}</ButtonLink> : null}
                  {hasSecondaryCta ? <ButtonLink href={content!.secondary_button_url!} variant="secondary">{content!.secondary_button_label}</ButtonLink> : null}
                </div>
              ) : null}
            </div> : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
