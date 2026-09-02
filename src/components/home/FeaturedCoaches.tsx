import { Link } from 'react-router-dom';
import { Reveal } from '@/components/Reveal';
import { useLanguage } from '@/context/LanguageContext';

export function FeaturedCoaches() {
  const { t } = useLanguage();
  return (
    <section className="bg-background py-32 md:py-44 border-t border-border">
      <div className="container">
        <div className="mb-16 md:mb-20">
          <span className="label-eyebrow text-gold">{t.featuredcoaches_eyebrow}</span>
          <h2
            className="mt-4 font-display text-foreground tracking-tight"
            style={{ fontSize: 'clamp(32px, 4.5vw, 56px)', lineHeight: 1 }}
          >
            {t.featuredcoaches_heading}
          </h2>
        </div>

        <Reveal className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="border border-border bg-background-secondary p-8 md:p-12 flex flex-col">
            <span className="font-display uppercase tracking-[0.15em] text-[11px] text-foreground-subtle">
              {t.featuredcoaches_athletes_label}
            </span>
            <h3 className="mt-4 font-display text-foreground text-2xl md:text-3xl tracking-tight">
              {t.featuredcoaches_athletes_title}
            </h3>
            <p className="mt-4 font-body text-foreground-muted leading-relaxed">
              {t.featuredcoaches_athletes_body}
            </p>
            <Link
              to="/register"
              className="mt-8 inline-flex self-start font-display uppercase tracking-[0.15em] text-sm text-foreground border-b border-copper pb-1 hover:text-gold transition-colors"
            >
              {t.featuredcoaches_athletes_cta} →
            </Link>
          </div>

          <div className="border border-border bg-background-secondary p-8 md:p-12 flex flex-col">
            <span className="font-display uppercase tracking-[0.15em] text-[11px] text-foreground-subtle">
              {t.featuredcoaches_coaches_label}
            </span>
            <h3 className="mt-4 font-display text-foreground text-2xl md:text-3xl tracking-tight">
              {t.featuredcoaches_coaches_title}
            </h3>
            <p className="mt-4 font-body text-foreground-muted leading-relaxed">
              {t.featuredcoaches_coaches_body}
            </p>
            <Link
              to="/for-coaches"
              className="mt-8 inline-flex self-start font-display uppercase tracking-[0.15em] text-sm text-foreground border-b border-copper pb-1 hover:text-gold transition-colors"
            >
              {t.featuredcoaches_coaches_cta} →
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
