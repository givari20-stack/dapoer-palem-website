import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/layout/container";

type CollectionPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  emptyMessage: string;
  records: (Record<string, unknown> & { image_url?: string | null; image_alt?: string | null })[];
  variant: "promo" | "event" | "gallery";
};

export function CollectionPage({
  eyebrow,
  title,
  description,
  emptyMessage,
  records,
  variant,
}: CollectionPageProps) {
  return (
    <>
      <Navbar mode="solid" />
      <main className="bg-cream pt-28 text-dark-green sm:pt-32">
        <section className="py-20 sm:py-28">
          <Container>
            <p className="text-xs font-bold tracking-[0.22em] text-palem-green uppercase">{eyebrow}</p>
            <h1 className="mt-4 max-w-4xl font-serif text-6xl leading-[0.9] sm:text-8xl">{title}</h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-dark-green/65">{description}</p>

            {records.length ? (
              <div className={`mt-14 grid gap-7 ${variant === "gallery" ? "sm:grid-cols-2 lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                {records.map((record) => (
                  <article key={String(record.id)} className="overflow-hidden rounded-lg border border-dark-green/10 bg-white">
                    {record.image_url ? (
                      // Signed private URLs are intentionally not optimized.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={record.image_url} alt={String(record.image_alt ?? record.alt_text ?? record.title ?? "Dapoer Palem content image")} className="aspect-[4/3] w-full object-cover" />
                    ) : null}
                    <div className="p-6 sm:p-8">
                      <p className="text-xs font-bold tracking-[0.16em] text-palem-green uppercase">
                        {String(record.category ?? record.status ?? eyebrow)}
                      </p>
                      <h2 className="mt-3 font-serif text-3xl">{String(record.title ?? "Untitled")}</h2>
                      <p className="mt-4 text-sm leading-7 text-dark-green/65">
                        {String(record.short_description ?? record.description ?? "")}
                      </p>
                      {variant === "event" && record.event_date ? (
                        <p className="mt-5 text-sm font-semibold">{new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(String(record.event_date)))}</p>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-14 rounded-lg border border-dashed border-dark-green/20 bg-white px-6 py-16 text-center text-dark-green/60">{emptyMessage}</p>
            )}
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
