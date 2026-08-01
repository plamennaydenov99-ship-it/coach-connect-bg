import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

const CITIES = [
  {
    name: 'French Riviera',
    image: 'https://images.unsplash.com/photo-1775029828803-38733896e59a?fm=jpg&q=80&w=1600',
    alt: 'Saint-Tropez harbour with pastel waterfront buildings and yachts in golden light',
  },

  {
    name: 'Sofia',
    image: 'https://images.unsplash.com/photo-1455529141151-d17aac90e709?fm=jpg&q=80&w=1600',
    alt: 'View over the rooftops of Sofia with mountains behind',
  },
  {
    name: 'Plovdiv',
    image: 'https://images.unsplash.com/photo-1729446952907-2a740280c116?fm=jpg&q=80&w=1600',
    alt: 'Street view of the historic old town of Plovdiv',
  },
  {
    name: 'Varna',
    image: 'https://images.unsplash.com/photo-1689217855532-af5f53acfd83?fm=jpg&q=80&w=1600',
    alt: 'Coastline and city view of Varna on the Black Sea',
  },
  {
    name: 'Paris',
    image: 'https://images.unsplash.com/photo-1520078176967-f827b3a1a899?fm=jpg&q=80&w=1600',
    alt: 'Parisian rooftops and skyline in warm light',
  },
  {
    name: 'Amsterdam',
    image: 'https://images.unsplash.com/photo-1536880756060-98a6a140f0a7?fm=jpg&q=80&w=1600',
    alt: 'Canal houses and bridges in Amsterdam',
  },
  {
    name: 'Rotterdam',
    image: 'https://images.unsplash.com/photo-1758195004300-7061d5138bae?fm=jpg&q=80&w=1600',
    alt: 'Modern architecture along the waterfront in Rotterdam',
  },
  {
    name: 'Berlin',
    image: 'https://images.unsplash.com/photo-1552553302-9211bf7f7053?fm=jpg&q=80&w=1600',
    alt: 'Berlin skyline with the television tower at dusk',
  },
];

export function CitiesSection() {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.8, 640), behavior: 'smooth' });
  };

  return (
    <section className="bg-background py-32 md:py-44 border-t border-border">
      <div className="container">
        <Reveal className="flex flex-wrap items-end justify-between gap-8">
          <div className="max-w-2xl">
            <span className="label-eyebrow text-foreground-muted">Where we're starting</span>
            <h2
              className="mt-6 font-display text-foreground tracking-tight"
              style={{ fontSize: 'clamp(32px, 4.5vw, 56px)', lineHeight: 1 }}
            >
              Find your coach,<br />by city.
            </h2>
            <p className="mt-8 font-body text-foreground-muted text-base md:text-lg leading-relaxed">
              We're opening city by city. Scroll to see where we're onboarding coaches next.
            </p>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Scroll cities left"
              className="h-11 w-11 border border-border text-foreground hover:border-foreground transition-colors flex items-center justify-center"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Scroll cities right"
              className="h-11 w-11 border border-border text-foreground hover:border-foreground transition-colors flex items-center justify-center"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </Reveal>
      </div>

      <div
        ref={trackRef}
        className="no-scrollbar mt-14 md:mt-20 flex gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory px-4 md:px-[max(1rem,calc((100vw-1400px)/2+1rem))] pb-2"
      >
        {CITIES.map((city) => (
          <Link
            key={city.name}
            to={`/search?city=${encodeURIComponent(city.name)}`}
            className="group relative shrink-0 snap-start w-[76vw] sm:w-[46vw] lg:w-[calc((100%-40px)/3)] max-w-[420px] aspect-[3/4] overflow-hidden bg-background-secondary"
            aria-label={`Find a coach in ${city.name}`}
          >
            <img
              src={city.image}
              alt={city.alt}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
            />
            {/* soft scrim so no text ever sits on a raw photo */}
            <div className="absolute inset-x-0 bottom-0 h-3/5 scrim-photo pointer-events-none" />

            {/* frosted glass panel */}
            <div className="absolute inset-x-0 bottom-0 frosted-panel">
              <div className="absolute inset-0 grain-overlay pointer-events-none" />
              <div className="relative p-6 md:p-7">
                <h3 className="font-display text-on-photo text-2xl md:text-3xl tracking-tight">
                  {city.name}
                </h3>
                <p className="mt-2 font-body text-sm leading-relaxed text-on-photo/85">
                  {city.blurb}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 font-display uppercase tracking-[0.15em] text-[11px] text-on-photo border-b border-[#F7F4EE]/60 pb-1">
                  Find a coach
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
                <span className="mt-3 block font-display uppercase tracking-[0.15em] text-[10px] text-on-photo/85">
                  Now onboarding coaches
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="container mt-6">
        <span className="font-display uppercase tracking-[0.2em] text-[10px] text-foreground-subtle">
          Scroll to see more →
        </span>
      </div>
    </section>
  );
}
