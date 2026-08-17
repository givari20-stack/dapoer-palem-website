import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/layout/container";
import { getPublicMenu } from "@/lib/public-content";

export const metadata: Metadata = { title: "Menu", description: "Published Dapoer Palem menu." };
export const dynamic = "force-dynamic";
const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

export default async function MenuPage() {
  const { categories, items } = await getPublicMenu();
  return (
    <>
      <Navbar mode="solid" />
      <main className="bg-cream pt-28 text-dark-green sm:pt-32">
        <section className="py-20 sm:py-28">
          <Container>
            <p className="text-xs font-bold tracking-[0.22em] text-palem-green uppercase">From the kitchen</p>
            <h1 className="mt-4 font-serif text-6xl leading-none sm:text-8xl">The menu.</h1>
            {items.length ? (
              <div className="mt-14 space-y-16">
                {categories.map((category) => {
                  const categoryItems = items.filter((item) => item.category_id === category.id);
                  if (!categoryItems.length) return null;
                  return (
                    <section key={category.id} aria-labelledby={`category-${category.id}`}>
                      <h2 id={`category-${category.id}`} className="border-b border-dark-green/15 pb-4 font-serif text-4xl">{category.name}</h2>
                      <div className="mt-6 grid gap-5 lg:grid-cols-2">
                        {categoryItems.map((item) => (
                          <article key={item.id} className="flex gap-5 rounded-lg border border-dark-green/10 bg-white p-5">
                            {item.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.image_url} alt={item.image_alt || item.name} className="size-24 shrink-0 rounded-md object-cover" />
                            ) : null}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-4">
                                <h3 className="font-serif text-2xl">{item.name}</h3>
                                <p className="shrink-0 text-sm font-bold text-palem-green">{rupiah.format(Number(item.price))}</p>
                              </div>
                              {item.description ? <p className="mt-2 text-sm leading-6 text-dark-green/60">{item.description}</p> : null}
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            ) : (
              <p className="mt-14 rounded-lg border border-dashed border-dark-green/20 bg-white px-6 py-16 text-center text-dark-green/60">No menu items have been published yet.</p>
            )}
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
