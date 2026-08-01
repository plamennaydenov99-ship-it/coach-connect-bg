import { Link } from 'react-router-dom';
import { Reveal, useParallax } from '@/components/Reveal';

const PILLARS = [
  {
    id: 'camps',
    eyebrow: 'Camps & Events',
    headline: 'Train further.\nCompete harder.',
    sub: 'Multi-day training camps, tournaments and events around the world — book your spot on the platform.',
    cta: 'Explore camps',
    to: '/camps',
    image:
      'https://images.pexels.com/photos/37926380/pexels-photo-37926380/free-photo-of-teen-soccer-player-dribbling-on-field.jpeg?auto=compress&cs=tinysrgb&w=2000',
    imageAlt: 'Young footballer dribbling the ball across a sunlit pitch',
    align: 'right' as const,
  },
  {
    id: 'studio',
    eyebrow: 'Studio & strength',
    headline: 'Pilates, mobility,\nrecovery.',
    sub: 'Reformer pilates, strength and conditioning, rehab work — the training that keeps you in the game, with coaches who specialise in it.',
    cta: 'Find a studio coach',
    to: '/search',
    image:
      'https://images.unsplash.com/photo-1747238415033-b74eec07eb59?fm=jpg&q=80&w=2000',
    imageAlt: 'Bright reformer pilates studio with warm natural light',
    align: 'left' as const,
  },
];


function Pillar({
  pillar,
  index,
  total,
}: {
  pillar: typeof PILLARS[number];
  index: number;
  total: number;
}) {
  const isRight = pillar.align === 'right';
  const bgRef = useParallax<HTMLImageElement>(0.18);
  return (
    <div className="relative w-full h-[85vh] min-h-[560px] overflow-hidden border-t border-border">
      <img
        ref={bgRef}
        src={pillar.image}
        alt={pillar.imageAlt}
        className="absolute inset-0 h-full w-full object-cover will-change-transform"
      />
      <div className="absolute inset-0 bg-background/20" />
      <div
        className={
          isRight
            ? 'absolute inset-0 bg-gradient-to-l from-background via-background/92 to-transparent'
            : 'absolute inset-0 bg-gradient-to-r from-background via-background/92 to-transparent'
        }
      />




      <div className="relative z-10 h-full container flex items-center">
        <Reveal className={`max-w-xl ${isRight ? 'ml-auto text-right' : ''}`}>
          <span className="label-eyebrow text-gold">{pillar.eyebrow}</span>

          <h3
            className="mt-6 font-display text-foreground tracking-tight whitespace-pre-line"
            style={{ fontSize: 'clamp(36px, 5.5vw, 64px)', lineHeight: 0.98 }}
          >
            {pillar.headline}
          </h3>

          <p className="mt-6 font-body text-foreground-muted text-base md:text-lg leading-relaxed">
            {pillar.sub}
          </p>

          <Link
            to={pillar.to}
            className="mt-8 inline-flex items-center gap-3 font-display uppercase tracking-[0.15em] text-sm text-foreground border-b border-copper pb-1 hover:text-gold transition-colors"
          >
            {pillar.cta}
            <span>→</span>
          </Link>
        </Reveal>
      </div>

      {total > 1 && (
        <div className="absolute bottom-6 left-6 md:left-10 font-display uppercase tracking-[0.2em] text-[11px] text-foreground-subtle">
          0{index + 1} / 0{total}
        </div>
      )}

    </div>
  );
}

export function PillarsSection() {
  return (
    <section>
      {PILLARS.map((pillar, index) => (
        <Pillar key={pillar.id} pillar={pillar} index={index} total={PILLARS.length} />
      ))}
    </section>
  );
}
