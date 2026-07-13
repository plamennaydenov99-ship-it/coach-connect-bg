import { Link } from 'react-router-dom';

const PILLARS = [
  {
    id: 'coaches',
    eyebrow: 'Coaches & Clubs',
    headline: 'Find your\nperfect coach.',
    sub: 'Browse verified coaches and clubs across 12 sports in Nice, Monaco & Sofia. Filter by location, level, and price. Message directly through the platform.',
    cta: 'Browse coaches',
    to: '/search',
    image: 'https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=2400&q=85',
    align: 'left' as const,
  },
  {
    id: 'camps',
    eyebrow: 'Camps & Events',
    headline: 'Train further.\nCompete harder.',
    sub: 'Discover multi-day training camps, tournaments, and sporting events across our three pilot cities. Book your spot directly on the platform.',
    cta: 'Explore camps',
    to: '/camps',
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=2400&q=85',
    align: 'right' as const,
  },
  {
    id: 'community',
    eyebrow: 'Community',
    headline: 'The sports movement\nfor Nice, Monaco & Sofia.',
    sub: 'Connect with athletes in your city, find training partners, share goals, and follow events. Sport is better together.',
    cta: 'Join the community',
    to: '/community',
    image: 'https://images.unsplash.com/photo-1526676037777-05a232554f77?w=2400&q=85',
    align: 'left' as const,
  },
];

export function PillarsSection() {
  return (
    <section>
      {PILLARS.map((pillar, index) => {
        const isRight = pillar.align === 'right';
        return (
          <div
            key={pillar.id}
            className="relative w-full h-[85vh] min-h-[560px] overflow-hidden border-t border-border"
          >
            {/* Background image */}
            <img
              src={pillar.image}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover grayscale"
            />
            {/* Overlay — full-width dark scrim so text stays legible over any photo */}
            <div className="absolute inset-0 bg-background/55" />
            <div
              className={`absolute inset-0 bg-gradient-to-${isRight ? 'l' : 'r'} from-background via-background/85 to-background/40`}
            />

            {/* Content */}
            <div className="relative z-10 h-full container flex items-center">
              <div className={`max-w-xl ${isRight ? 'ml-auto text-right' : ''}`}>
                <span className="label-eyebrow text-ice">{pillar.eyebrow}</span>

                <h3
                  className="mt-6 font-display text-ivory tracking-tight whitespace-pre-line"
                  style={{ fontSize: 'clamp(36px, 5.5vw, 64px)', lineHeight: 0.98 }}
                >
                  {pillar.headline}
                </h3>

                <p className="mt-6 font-body text-foreground-muted text-base md:text-lg leading-relaxed">
                  {pillar.sub}
                </p>

                <Link
                  to={pillar.to}
                  className="mt-8 inline-flex items-center gap-3 font-display uppercase tracking-[0.15em] text-sm text-ivory border-b border-ice pb-1 hover:text-ice transition-colors"
                >
                  {pillar.cta}
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Section number */}
            <div className="absolute bottom-6 left-6 md:left-10 font-display uppercase tracking-[0.2em] text-[11px] text-foreground-subtle">
              0{index + 1} / 03
            </div>
          </div>
        );
      })}
    </section>
  );
}
