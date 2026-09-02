import { Link } from 'react-router-dom';
import { Reveal, useParallax } from '@/components/Reveal';
import { useLanguage, type TranslationKey } from '@/context/LanguageContext';

interface PillarDef {
  id: string;
  eyebrow: TranslationKey;
  headline: TranslationKey;
  sub: TranslationKey;
  cta: TranslationKey;
  to: string;
  image: string;
  imageAlt: TranslationKey;
  align: 'left' | 'right';
}

const PILLARS: PillarDef[] = [
  {
    id: 'camps',
    eyebrow: 'pillars_camps_eyebrow',
    headline: 'pillars_camps_headline',
    sub: 'pillars_camps_sub',
    cta: 'pillars_camps_cta',
    to: '/camps',
    image:
      'https://images.pexels.com/photos/37926380/pexels-photo-37926380/free-photo-of-teen-soccer-player-dribbling-on-field.jpeg?auto=compress&cs=tinysrgb&w=2000',
    imageAlt: 'pillars_camps_alt',
    align: 'right' as const,
  },
  {
    id: 'studio',
    eyebrow: 'pillars_studio_eyebrow',
    headline: 'pillars_studio_headline',
    sub: 'pillars_studio_sub',
    cta: 'pillars_studio_cta',
    to: '/search',
    image:
      'https://images.unsplash.com/photo-1747238415033-b74eec07eb59?fm=jpg&q=80&w=2000',
    imageAlt: 'pillars_studio_alt',
    align: 'left' as const,
  },
];


function Pillar({
  pillar,
  index,
  total,
}: {
  pillar: PillarDef;
  index: number;
  total: number;
}) {
  const { t } = useLanguage();
  const isRight = pillar.align === 'right';
  const bgRef = useParallax<HTMLImageElement>(0.18);
  return (
    <div className="relative w-full h-[85vh] min-h-[560px] overflow-hidden border-t border-border">
      <img
        ref={bgRef}
        src={pillar.image}
        alt={t[pillar.imageAlt]}
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
