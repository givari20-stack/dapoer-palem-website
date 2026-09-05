import { Container } from "@/components/layout/container";
import { ButtonLink } from "@/components/ui/button";

const fallbackPreviews = [
  {
    eyebrow: "Promo",
    title: "No current promotions.",
    copy: "Published promotions will appear here when available.",
    href: "/promo",
    cta: "View Promo",
  },
  {
    eyebrow: "Event",
    title: "No upcoming events.",
    copy: "Published event information will appear here when available.",
    href: "/event",
    cta: "View Events",
  },
] as const;

type UpdatePreview = { eyebrow: string; title: string; copy: string; href: string; cta: string; published?: boolean; meta?: string; imageUrl?: string; imageAlt?: string };

function formatDate(value: unknown) {
  if (!value) return "";
  const date = new Date(String(value));
  return Number.isNaN(date.valueOf()) ? "" : new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(date);
}

export function UpdatesPreview({ promo, event }: { promo?: Record<string, unknown> | null; event?: Record<string, unknown> | null }) {
  const previews: UpdatePreview[] = [
    promo
      ? { eyebrow: "Promo", title: String(promo.title), copy: String(promo.short_description || ""), href: String(promo.cta_url || "/promo"), cta: String(promo.cta_label || "View Promo"), published: true, meta: [formatDate(promo.start_date), formatDate(promo.end_date)].filter(Boolean).join(" – "), imageUrl: promo.image_url ? String(promo.image_url) : undefined, imageAlt: promo.image_alt ? String(promo.image_alt) : undefined }
      : fallbackPreviews[0],
    event
      ? { eyebrow: "Event", title: String(event.title), copy: String(event.description || ""), href: String(event.cta_url || "/event"), cta: String(event.cta_label || "View Events"), published: true, meta: [formatDate(event.event_date), event.start_time ? String(event.start_time).slice(0, 5) : "", event.location ? String(event.location) : ""].filter(Boolean).join(" · "), imageUrl: event.image_url ? String(event.image_url) : undefined, imageAlt: event.image_alt ? String(event.image_alt) : undefined }
      : fallbackPreviews[1],
  ];
  return (
    <section aria-label="Promo and event previews" className="bg-brand-white py-24 sm:py-32 lg:py-36">
      <Container>
        <div className="grid border-y border-dark-green/12 lg:grid-cols-2">
          {previews.map((preview, index) => (
            <article
              key={preview.eyebrow}
              aria-label={preview.imageAlt}
              className={`relative isolate overflow-hidden bg-cover bg-center py-12 sm:py-16 lg:px-14 ${
                index === 0
                  ? "border-b border-dark-green/12 lg:border-b-0 lg:border-r lg:pl-0"
                  : "lg:pr-0"
              } ${preview.imageUrl ? "px-6 text-brand-white sm:px-10" : ""}`}
              style={preview.imageUrl ? { backgroundImage: `url(${preview.imageUrl})` } : undefined}
            >
              {preview.imageUrl ? <div aria-hidden="true" className="absolute inset-0 -z-10 bg-dark-green/85" /> : null}
              <div className="flex items-center justify-between gap-6">
                <p className={`text-[0.6875rem] font-bold tracking-[0.24em] uppercase ${preview.imageUrl ? "text-gold" : "text-palem-green"}`}>
                  {preview.eyebrow}
                </p>
                <span className={`rounded-[var(--radius-pill)] border border-gold/45 px-3 py-1 text-[0.5625rem] font-bold tracking-[0.14em] uppercase ${preview.imageUrl ? "text-brand-white/70" : "text-dark-green/55"}`}>
                  {preview.published ? "Published" : "Not available"}
                </span>
              </div>
              <h2 className={`mt-12 max-w-lg font-serif text-4xl leading-tight font-semibold sm:text-5xl ${preview.imageUrl ? "text-brand-white" : "text-dark-green"}`}>
                {preview.title}
              </h2>
              <p className={`mt-5 max-w-lg text-sm leading-7 ${preview.imageUrl ? "text-brand-white/75" : "text-dark-green/65"}`}>
                {preview.copy}
              </p>
              {preview.meta ? <p className={`mt-4 text-xs font-semibold ${preview.imageUrl ? "text-cream" : "text-dark-green/70"}`}>{preview.meta}</p> : null}
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
