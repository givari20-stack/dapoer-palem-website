import { Container } from "@/components/layout/container";
import { ButtonLink } from "@/components/ui/button";

const fallbackPreviews = [
  {
    eyebrow: "Promo",
    title: "New offers will appear here.",
    copy: "There are no published promotions yet. This area is ready for confirmed offers when they become available.",
    href: "/promo",
    cta: "View Promo",
  },
  {
    eyebrow: "Event",
    title: "Upcoming moments, coming soon.",
    copy: "There are no published events yet. This preview is prepared for future event information and dates.",
    href: "/event",
    cta: "View Events",
  },
] as const;

type UpdatePreview = { eyebrow: string; title: string; copy: string; href: string; cta: string; published?: boolean };

export function UpdatesPreview({ promo, event }: { promo?: Record<string, unknown> | null; event?: Record<string, unknown> | null }) {
  const previews: UpdatePreview[] = [
    promo
      ? { eyebrow: "Promo", title: String(promo.title), copy: String(promo.short_description || ""), href: String(promo.cta_url || "/promo"), cta: String(promo.cta_label || "View Promo"), published: true }
      : fallbackPreviews[0],
    event
      ? { eyebrow: "Event", title: String(event.title), copy: String(event.description || ""), href: String(event.cta_url || "/event"), cta: String(event.cta_label || "View Events"), published: true }
      : fallbackPreviews[1],
  ];
  return (
    <section aria-label="Promo and event previews" className="bg-brand-white py-24 sm:py-32 lg:py-36">
      <Container>
        <div className="grid border-y border-dark-green/12 lg:grid-cols-2">
          {previews.map((preview, index) => (
            <article
              key={preview.eyebrow}
              className={`py-12 sm:py-16 lg:px-14 ${
                index === 0
                  ? "border-b border-dark-green/12 lg:border-b-0 lg:border-r lg:pl-0"
                  : "lg:pr-0"
              }`}
            >
              <div className="flex items-center justify-between gap-6">
                <p className="text-[0.6875rem] font-bold tracking-[0.24em] text-palem-green uppercase">
                  {preview.eyebrow}
                </p>
                <span className="rounded-[var(--radius-pill)] border border-gold/45 px-3 py-1 text-[0.5625rem] font-bold tracking-[0.14em] text-dark-green/55 uppercase">
                  {preview.published ? "Published" : "Coming soon"}
                </span>
              </div>
              <h2 className="mt-12 max-w-lg font-serif text-4xl leading-tight font-semibold text-dark-green sm:text-5xl">
                {preview.title}
              </h2>
              <p className="mt-5 max-w-lg text-sm leading-7 text-dark-green/65">
                {preview.copy}
              </p>
              <ButtonLink href={preview.href} variant="ghost" className="mt-8 -ml-6">
                {preview.cta}
                <span aria-hidden="true" className="ml-3 text-gold">↗</span>
              </ButtonLink>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
