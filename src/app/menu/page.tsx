import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { MenuPresentation } from "@/components/public/menu-presentation";
import { getPublicMenu } from "@/lib/public-content";

export const metadata: Metadata = { title: "Menu", description: "Published Dapoer Palem menu." };
export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const { categories, items } = await getPublicMenu();
  return (
    <>
      <Navbar mode="solid" />
      <main className="bg-cream pt-28 text-dark-green sm:pt-32"><MenuPresentation categories={categories} items={items} /></main>
      <Footer />
    </>
  );
}
