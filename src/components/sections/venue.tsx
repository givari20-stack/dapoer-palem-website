import { Container } from "@/components/layout/container";
import { ButtonLink } from "@/components/ui/button";
import { EditorialVisual } from "@/components/ui/editorial-visual";
import type { HomepageSectionContent } from "@/lib/public-content";

export function Venue({ content }: { content?: HomepageSectionContent }) {
  const hasSecondaryCta = Boolean(content?.secondary_button_label && content.secondary_button_url);
  return (
    <section aria-labelledby="venue-title" className="bg-cream py-24 sm:py-32 lg:py-40">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1.28fr_0.72fr] lg:items-end lg:gap-20">
          <EditorialVisual
            label={content?.image_alt || "Dapoer Palem venue"}
            className="min-h-[28rem] bg-cover bg-center sm:min-h-[38rem] lg:min-h-[46rem]"
            style={content?.image_url ? { backgroundImage: `url(${content.image_url})` } : undefined}
          />

          <div className="lg:pb-10">
            <p className="mb-5 text-[0.6875rem] font-bold tracking-[0.24em] text-palem-green uppercase">
              {content?.eyebrow || "Experience the space"}
            </p>
            <h2
              id="venue-title"
              className="font-serif text-5xl leading-[0.95] font-semibold tracking-[-0.03em] text-dark-green sm:text-6xl"
            >
              {content?.heading ? content.heading : <><span>Room to gather,</span><span className="block italic text-palem-green">pause, and stay.</span></>}
            </h2>
            {content?.description ? <p className="mt-8 text-base leading-8 text-dark-green/68">{content.description}</p> : null}
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href={content?.primary_button_url || "/gallery"} variant="secondary">{content?.primary_button_label || "View Gallery"}</ButtonLink>
              {hasSecondaryCta ? <ButtonLink href={content!.secondary_button_url!} variant="secondary">{content!.secondary_button_label}</ButtonLink> : null}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
