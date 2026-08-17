import { Container } from "@/components/layout/container";
import { EditorialVisual } from "@/components/ui/editorial-visual";

const fallbackExperiences = [
  {
    number: "01",
    title: "Food",
    copy: "A future window into the dishes and dining experience, ready for approved menu imagery and copy.",
  },
  {
    number: "02",
    title: "Drinks",
    copy: "A reserved space for the drinks collection, to be completed when the real selection is available.",
  },
  {
    number: "03",
    title: "Atmosphere",
    copy: "A visual introduction to the setting and sense of place, awaiting official venue photography.",
  },
] as const;

type Experience = { id?: string; title: string; description?: string | null; image_url?: string | null; image_alt?: string | null };

export function FeaturedExperience({ experiences = fallbackExperiences }: { experiences?: readonly Experience[] }) {
  return (
    <section
      aria-labelledby="experience-title"
      className="bg-brand-white py-24 sm:py-32 lg:py-40"
    >
      <Container>
        <div className="flex flex-col gap-6 border-b border-dark-green/12 pb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-4 text-[0.6875rem] font-bold tracking-[0.24em] text-palem-green uppercase">
              The experience
            </p>
            <h2
              id="experience-title"
              className="font-serif text-5xl leading-none font-semibold tracking-[-0.03em] text-dark-green sm:text-6xl"
            >
              Made to be shared.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-7 text-dark-green/60">
            Image-ready categories for future approved content.
          </p>
        </div>

        <div className="mt-12 grid gap-12 md:grid-cols-3 md:gap-5 lg:gap-8">
          {experiences.map((item, index) => {
            const number = "number" in item && typeof item.number === "string"
              ? item.number
              : String(index + 1).padStart(2, "0");
            const copy = "copy" in item && typeof item.copy === "string"
              ? item.copy
              : item.description;
            return (
            <article key={item.id ?? item.title} className={index === 1 ? "md:mt-16" : ""}>
              {item.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image_url} alt={item.image_alt || item.title} className="aspect-[4/5] w-full object-cover" />
              ) : (
                <EditorialVisual label={item.title} className="aspect-[4/5] p-6 sm:p-8">
                <span className="absolute left-6 top-6 text-[0.625rem] font-bold tracking-[0.2em] text-gold sm:left-8 sm:top-8">
                  {number}
                </span>
                <span className="absolute bottom-6 right-6 text-[0.625rem] font-bold tracking-[0.15em] text-brand-white/55 uppercase sm:bottom-8 sm:right-8">
                  Imagery to follow
                </span>
                </EditorialVisual>
              )}
              <h3 className="mt-7 font-serif text-4xl font-semibold text-dark-green">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-dark-green/65">
                {copy}
              </p>
            </article>
          );})}
        </div>
      </Container>
    </section>
  );
}
