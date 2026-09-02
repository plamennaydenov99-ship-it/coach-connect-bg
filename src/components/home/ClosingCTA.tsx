import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/Reveal';
import { useLanguage } from '@/context/LanguageContext';

export function ClosingCTA() {
  const { t } = useLanguage();
  return (
    <section className="relative bg-background overflow-hidden border-t border-border">
      <Reveal className="relative container py-36 md:py-52 text-center max-w-3xl">
        {/* Thin accent line top */}
        <div className="h-px w-16 bg-crest mx-auto mb-12" />

        <span className="label-eyebrow text-gold">{t.closingcta_eyebrow}</span>

        <h2
          className="mt-8 font-display text-foreground tracking-tight"
          style={{ fontSize: 'clamp(36px, 5.5vw, 68px)', lineHeight: 1 }}
        >
          {t.closingcta_heading_a}<br />{t.closingcta_heading_b}
        </h2>

        <p className="mt-10 font-body text-foreground-muted text-base md:text-lg leading-relaxed max-w-xl mx-auto">
          {t.closingcta_sub}
        </p>



        <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
          <Link to="/search">
            <Button size="lg" className="tracking-[0.12em] h-12 px-7">
              {t.closingcta_cta_find}
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button
              variant="outline"
              size="lg"
              className="tracking-[0.12em] h-12 px-7"
            >
              {t.closingcta_cta_coach} →
            </Button>
          </Link>
        </div>

        <p className="mt-12 font-display uppercase tracking-[0.2em] text-[11px] text-foreground-subtle">
          {t.closingcta_note}
        </p>
      </Reveal>
    </section>
  );
}
