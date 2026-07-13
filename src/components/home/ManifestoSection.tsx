export function ManifestoSection() {
  const stats = [
    { number: '200+', label: 'Verified coaches' },
    { number: '12', label: 'Sports covered' },
    { number: '3', label: 'Cities worldwide' },
  ];

  return (
    <section className="bg-background py-28 md:py-40 border-t border-border">
      <div className="container max-w-5xl">
        {/* Thin ice line above */}
        <div className="h-px w-16 bg-navy mb-12" />

        {/* Manifesto */}
        <h2
          className="font-display text-foreground tracking-tight"
          style={{ fontSize: 'clamp(36px, 5.5vw, 68px)', lineHeight: 1.02 }}
        >
          Every athlete deserves<br />a great coach.<br />
          <span className="text-foreground-muted">Now they can find one.</span>
        </h2>

        {/* Supporting paragraph */}
        <p className="mt-10 max-w-2xl font-body text-base md:text-lg text-foreground-muted leading-relaxed">
          Zenit connects athletes with verified coaches and clubs in Nice, Monaco &amp; Sofia.
          Whether you're just starting out or training to compete — your coach is here.
        </p>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-0 border-t border-border pt-12">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`flex flex-col ${i > 0 ? 'md:pl-12 md:border-l md:border-border' : ''}`}
            >
              <span className="font-display text-foreground text-5xl md:text-6xl tracking-tight">
                {stat.number}
              </span>
              <span className="mt-3 font-display uppercase tracking-[0.15em] text-xs text-foreground-subtle">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
