import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { FeaturedExperience } from "@/components/sections/featured-experience";
import { Hero } from "@/components/sections/hero";
import { Intro } from "@/components/sections/intro";
import { Location } from "@/components/sections/location";
import { MenuCta } from "@/components/sections/menu-cta";
import { ReservationCta } from "@/components/sections/reservation-cta";
import { UpdatesPreview } from "@/components/sections/updates-preview";
import { Venue } from "@/components/sections/venue";
import { getHomepageContent } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export default async function Home() {
  const content = await getHomepageContent();
  const hero = content.sections.get("hero");
  const menuCta = content.sections.get("menu_cta");
  const location = content.sections.get("location");
  return (
    <>
      <Navbar mode="overlay" />
      <main>
        <Hero content={hero} />
        <Intro />
        <FeaturedExperience experiences={content.experiences.length ? content.experiences : undefined} />
        <MenuCta content={menuCta} />
        <Venue />
        <UpdatesPreview promo={content.promo} event={content.event} />
        <ReservationCta />
        <Location content={location} />
      </main>
      <Footer />
    </>
  );
}
