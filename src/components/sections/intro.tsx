import { Container } from "@/components/layout/container";

export function Intro() {
  return (
    <section aria-labelledby="intro-title" className="bg-cream py-24 sm:py-32 lg:py-40">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-24">
          <div>
            <p className="flex items-center gap-4 text-[0.6875rem] font-bold tracking-[0.24em] text-palem-green uppercase">
              <span className="h-px w-8 bg-gold" aria-hidden="true" />
              Welcome
            </p>
          </div>
          <div>
            <h2
              id="intro-title"
              className="max-w-4xl font-serif text-5xl leading-[0.95] font-semibold tracking-[-0.035em] text-dark-green sm:text-6xl lg:text-7xl"
            >
              A place for food,
              <span className="block italic text-palem-green">
                conversation, and connection.
              </span>
            </h2>
            <div className="mt-10 grid gap-6 border-t border-dark-green/12 pt-8 sm:grid-cols-[1fr_auto] sm:gap-12">
              <p className="max-w-2xl text-base leading-8 text-dark-green/70 sm:text-lg sm:leading-9">
                This introduction will share how food, gathering, and a
                nature-inspired atmosphere come together at Dapoer Palem. The
                final brand story will be added when supplied.
              </p>
              <p className="text-[0.625rem] font-bold tracking-[0.18em] text-dark-green/45 uppercase sm:max-w-32">
                Temporary introduction copy
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
