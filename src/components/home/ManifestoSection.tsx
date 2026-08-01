import { Reveal } from '@/components/Reveal';

export function ManifestoSection() {
  const pillars = [
    { title: 'Now onboarding', label: 'Coaches across 12 sports' },
    { title: 'Verified only', label: 'Every coach checked before listing' },
    { title: 'Wherever you train', label: 'Built for athletes everywhere' },
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
            Every athlete deserves<br />a great coach.<br />
            <span className="text-foreground-muted">Now they can find one.</span>
          </h2>

          {/* Supporting paragraph */}
          <p className="mt-12 max-w-2xl font-body text-base md:text-lg text-foreground-muted leading-relaxed">
            Zenit connects athletes with verified coaches — wherever you train.
            Starting out or chasing a podium, your coach is here.
          </p>
        </Reveal>

        {/* Founder note */}
        <Reveal delay={100}>
          <div className="mt-20 max-w-2xl border-l border-border pl-6 md:pl-8">
            <span className="label-eyebrow text-gold">Why we're building this</span>
            <p className="mt-5 font-body text-base text-foreground-muted leading-relaxed">
              We spent years asking around for a decent coach — friends of friends,
              dead forum threads, a number on a club noticeboard. Good coaches were
              out there; there was no honest way to find them. So we're building the
              place we wish we'd had, slowly, with people who care.
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
