import { Reveal } from '@/components/Reveal';
import { useLanguage } from '@/context/LanguageContext';

export function ManifestoSection() {
  const { t } = useLanguage();
  const pillars = [
    { title: t.manifesto_pillar1_title, label: t.manifesto_pillar1_label },
    { title: t.manifesto_pillar2_title, label: t.manifesto_pillar2_label },
    { title: t.manifesto_pillar3_title, label: t.manifesto_pillar3_label },
  ];


  return (
    <section className="bg-background py-32 md:py-48 border-t border-border">
      <div className="container max-w-5xl">
        <div className="h-px w-16 bg-crest mb-14" />

        {/* Manifesto */}
        <Reveal>
          <h2
            className="font-display text-foreground tracking-tight"
            style={{ fontSize: 'clamp(36px, 5.5vw, 68px)', lineHeight: 1.02 }}
          >
            {t.manifesto_heading_a}<br />{t.manifesto_heading_b}<br />
            <span className="text-foreground-muted">{t.manifesto_heading_c}</span>
          </h2>

          {/* Supporting paragraph */}
          <p className="mt-12 max-w-2xl font-body text-base md:text-lg text-foreground-muted leading-relaxed">
            {t.manifesto_sub}
          </p>
        </Reveal>

        {/* Founder note */}
        <Reveal delay={100}>
          <div className="mt-20 max-w-2xl border-l border-border pl-6 md:pl-8">
            <span className="label-eyebrow text-gold">{t.manifesto_founder_eyebrow}</span>
            <p className="mt-5 font-body text-base text-foreground-muted leading-relaxed">
              {t.manifesto_founder_note}
            </p>
          </div>
        </Reveal>


        {/* Stats */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-0 border-t border-border pt-16">
          {pillars.map((item, i) => (
            <Reveal
              key={i}
              delay={i * 120}
              className={`flex flex-col ${i > 0 ? 'md:pl-12 md:border-l md:border-border' : ''}`}
            >
              <span className="font-display text-foreground text-3xl md:text-4xl tracking-tight">
                {item.title}
              </span>
              <span className="mt-3 font-display uppercase tracking-[0.15em] text-xs text-foreground-subtle">
                {item.label}
              </span>
            </Reveal>
          ))}
        </div>

      </div>
    </section>
  );
}
