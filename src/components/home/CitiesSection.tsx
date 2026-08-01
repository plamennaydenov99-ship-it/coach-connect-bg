import { Link } from 'react-router-dom';
import { Reveal } from '@/components/Reveal';

const CITIES = [
  {
    name: 'Sofia',
    blurb: 'Padel, tennis and football, from city courts to the mountain trails.',
    image:
      'https://images.unsplash.com/photo-1455529141151-d17aac90e709?fm=jpg&q=80&w=1600',
    alt: 'View over the rooftops of Sofia with mountains behind',
    position: 'center',
  },
  {
    name: 'Nice',
    blurb: 'Year-round outdoor training between the sea and the hills.',
    image:
      'https://images.unsplash.com/photo-1643914729809-4aa59fdc4c17?fm=jpg&q=80&w=1600',
    alt: 'The seafront and bay of Nice on the French Riviera',
    position: 'center',
  },
  {
    name: 'Monaco',
    blurb: 'A small city with a serious appetite for high-level sport.',
    image:
      'https://images.unsplash.com/photo-1570003550662-dfc736bf772d?fm=jpg&q=80&w=1600',
    alt: 'The harbour and skyline of Monaco',
    position: 'bottom',
  },
];

export function CitiesSection() {
  return (
    <section className="bg-background py-32 md:py-44 border-t border-border">
      <div className="container">
        <Reveal className="max-w-2xl">
          <span className="label-eyebrow text-gold">Where we're starting</span>
          <h2
            className="mt-6 font-display text-foreground tracking-tight"
            style={{ fontSize: 'clamp(32px, 4.5vw, 56px)', lineHeight: 1 }}
          >
            Find your coach,<br />by city.
          </h2>
          <p className="mt-8 font-body text-foreground-muted text-base md:text-lg leading-relaxed">
            We're opening city by city, starting with three we know well.
          </p>
        </Reveal>

        <div className="mt-16 md:mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {CITIES.map((city, i) => (
            <Reveal key={city.name} delay={i * 120}>
              <Link
                to={`/search?city=${encodeURIComponent(city.name)}`}
                className="group block"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-background-secondary">
                  <img
                    src={city.image}
                    alt={city.alt}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    style={{ objectPosition: `center ${city.position}` }}
                  />
                </div>
                <h3 className="mt-6 font-display text-foreground text-2xl md:text-3xl tracking-tight">
                  {city.name}
                </h3>
                <p className="mt-3 font-body text-foreground-muted leading-relaxed">
                  {city.blurb}
                </p>
                <span className="mt-5 inline-flex font-display uppercase tracking-[0.15em] text-[11px] text-crest border-b border-crest pb-1">
                  Now onboarding coaches →
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
