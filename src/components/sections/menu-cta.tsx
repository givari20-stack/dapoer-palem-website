import { Container } from "@/components/layout/container";
import { ButtonLink } from "@/components/ui/button";

type MenuCtaContent = { eyebrow?: string | null; heading?: string | null; description?: string | null; primary_button_label?: string | null; primary_button_url?: string | null };

export function MenuCta({ content }: { content?: MenuCtaContent }) {
  return (
    <section aria-labelledby="menu-title" className="relative overflow-hidden bg-dark-green py-24 text-brand-white sm:py-32 lg:py-40">
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
          <p className="max-w-md text-base leading-8 text-brand-white/70">
            {content?.description || "The complete Dapoer Palem menu will be presented here once its official dishes and details are supplied."}
          </p>
          <ButtonLink href={content?.primary_button_url || "/menu"} className="mt-8">
            {content?.primary_button_label || "Explore Menu"}
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
