import { Container } from "@/components/layout/container";
import { ButtonLink } from "@/components/ui/button";
import { EditorialVisual } from "@/components/ui/editorial-visual";
import type { PublicAboutContent } from "@/lib/public-content";

type AboutPresentationProps = { content: PublicAboutContent | null; tagline?: string };

export function AboutPresentation({ content, tagline = "Inspired by Nature" }: AboutPresentationProps) {
  return (
    <main className="overflow-hidden bg-cream pt-28 text-dark-green sm:pt-32">
      <section className="border-b border-dark-green/10 py-20 sm:py-28 lg:py-32">
        <Container>
          <p className="flex items-center gap-4 text-xs font-bold tracking-[0.22em] text-palem-green uppercase">
            <span aria-hidden="true" className="h-px w-8 bg-gold" />
            {content?.eyebrow || "About"}
          </p>
          <h1 className="mt-5 max-w-5xl font-serif text-6xl leading-[0.9] font-semibold tracking-[-0.04em] sm:text-8xl lg:text-9xl">
            {content?.heading || "About Dapoer Palem"}
          </h1>
          {content?.description ? <p className="mt-8 max-w-3xl text-base leading-8 text-dark-green/68 sm:text-lg sm:leading-9">{content.description}</p> : null}
        </Container>
      </section>

      {content ? (
        <>
          <section aria-labelledby="about-story-title" className="py-24 sm:py-32 lg:py-40">
            <Container className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-24">
              <p className="text-xs font-bold tracking-[0.22em] text-palem-green uppercase">{tagline}</p>
              <div>
                <h2 id="about-story-title" className="font-serif text-5xl leading-[0.95] font-semibold tracking-[-0.035em] sm:text-7xl">{content.heading}</h2>
                {content.supporting_text ? <p className="mt-9 max-w-3xl border-t border-dark-green/12 pt-8 text-base leading-8 text-dark-green/68 sm:text-lg sm:leading-9">{content.supporting_text}</p> : null}
              </div>
            </Container>
          </section>

          <section className="pb-24 sm:pb-32 lg:pb-40">
            <Container>
              {content.image_url ? (
                // Signed private URLs are intentionally not optimized.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={content.image_url} alt={content.image_alt || "Dapoer Palem"} className="aspect-[16/9] w-full rounded-lg object-cover shadow-soft" />
              ) : (
                <EditorialVisual label="Dapoer Palem about" className="min-h-[24rem] rounded-lg sm:min-h-[34rem]">
                  <div className="absolute inset-x-8 bottom-8 border-t border-brand-white/20 pt-5 sm:inset-x-10 sm:bottom-10">
                    <p className="text-xs text-brand-white/60">Approved About imagery has not been supplied yet.</p>
                  </div>
                </EditorialVisual>
              )}
            </Container>
          </section>

          {content.cta_label && content.cta_url ? (
            <section className="bg-palem-green py-20 text-brand-white sm:py-24">
              <Container className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-2xl font-serif text-4xl leading-tight text-cream sm:text-5xl">{content.heading}</p>
                <ButtonLink href={content.cta_url} className="!border-brand-white !bg-brand-white !text-dark-green shadow-none hover:!bg-cream">{content.cta_label}</ButtonLink>
              </Container>
            </section>
          ) : null}
        </>
      ) : (
        <section className="py-24 sm:py-32">
          <Container>
            <div className="rounded-lg border border-dashed border-dark-green/20 bg-white px-6 py-16 text-center shadow-soft sm:py-20">
              <p className="text-xs font-bold tracking-[0.2em] text-palem-green uppercase">{tagline}</p>
              <h2 className="mt-4 font-serif text-4xl sm:text-5xl">Our About story is being prepared.</h2>
              <p className="mx-auto mt-5 max-w-xl leading-8 text-dark-green/60">Published brand information will appear here once it has been approved in the CMS.</p>
            </div>
          </Container>
        </section>
      )}
    </main>
  );
}
