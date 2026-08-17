import { Container } from "@/components/layout/container";
import { ButtonLink } from "@/components/ui/button";
import { EditorialVisual } from "@/components/ui/editorial-visual";

export function Venue() {
  return (
    <section aria-labelledby="venue-title" className="bg-cream py-24 sm:py-32 lg:py-40">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1.28fr_0.72fr] lg:items-end lg:gap-20">
          <EditorialVisual
            label="Dapoer Palem venue"
            className="min-h-[28rem] sm:min-h-[38rem] lg:min-h-[46rem]"
          >
            <div className="absolute inset-x-8 bottom-8 flex items-end justify-between border-t border-brand-white/20 pt-5 sm:inset-x-10 sm:bottom-10">
              <p className="text-[0.625rem] font-bold tracking-[0.2em] text-gold uppercase">
                Venue imagery
              </p>
              <p className="text-xs text-brand-white/55">To be supplied</p>
            </div>
          </EditorialVisual>

          <div className="lg:pb-10">
            <p className="mb-5 text-[0.6875rem] font-bold tracking-[0.24em] text-palem-green uppercase">
              Experience the space
            </p>
            <h2
              id="venue-title"
              className="font-serif text-5xl leading-[0.95] font-semibold tracking-[-0.03em] text-dark-green sm:text-6xl"
            >
              Room to gather,
              <span className="block italic text-palem-green">pause, and stay.</span>
            </h2>
            <p className="mt-8 text-base leading-8 text-dark-green/68">
              This section is prepared for the official venue story and
              photography. Final details about the space will be added once
              confirmed.
            </p>
            <ButtonLink href="/gallery" variant="secondary" className="mt-9">
              View Gallery
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
