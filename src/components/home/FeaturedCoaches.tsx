import { Link } from 'react-router-dom';
import { COACHES } from '@/lib/mockData';

export function FeaturedCoaches() {
  const featured = COACHES[0];
  const secondary = COACHES.slice(1, 3);

  return (
    <section className="bg-background py-24 md:py-32 border-t border-border">
      <div className="container">
        {/* Section header */}
        <div className="flex items-end justify-between gap-6 mb-12 md:mb-16">
          <div>
            <span className="label-eyebrow text-ice">Featured coaches</span>
            <h2
              className="mt-4 font-display text-ivory tracking-tight"
              style={{ fontSize: 'clamp(32px, 4.5vw, 56px)', lineHeight: 1 }}
            >
              Meet the coaches.
            </h2>
          </div>
          <Link
            to="/search"
            className="hidden md:inline-flex font-display uppercase tracking-[0.15em] text-sm text-ivory border-b border-ice pb-1 hover:text-ice transition-colors"
          >
            Browse all →
          </Link>
        </div>

        {/* Coach layout — 1 large + 2 small */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Featured — large, spans 2 columns */}
          <Link
            to={`/coach/${featured.slug}`}
            className="lg:col-span-2 group relative h-[480px] md:h-[600px] overflow-hidden border border-border bg-background-secondary"
          >
            <img
              src={featured.cover}
              alt={featured.name}
              className="absolute inset-0 h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-8 md:p-10">
              <div className="flex items-center gap-3 mb-5">
                <span className="font-display uppercase tracking-[0.15em] text-[11px] text-ivory bg-background-secondary border border-border px-3 py-1">
                  {featured.sport}
                </span>
                {featured.verified && (
                  <span className="font-display uppercase tracking-[0.15em] text-[11px] text-ice border border-ice px-3 py-1">
                    ✓ Verified
                  </span>
                )}
              </div>

              <h3 className="font-display text-ivory text-3xl md:text-5xl tracking-tight">
                {featured.name}
              </h3>
              <p className="mt-2 font-body text-foreground-muted">
                {featured.city} · {featured.yearsExperience} years experience
              </p>

              <div className="mt-6 flex items-end justify-between gap-4">
                <div className="font-display text-ivory">
                  <span className="text-3xl md:text-4xl">€{featured.pricePerSession}</span>
                  <span className="text-sm text-foreground-muted ml-1">/session</span>
                </div>
                <div className="font-display uppercase tracking-[0.12em] text-xs text-ember">
                  ★ {featured.rating} ({featured.reviewCount})
                </div>
              </div>
            </div>
          </Link>

          {/* Two secondary coaches — stacked */}
          <div className="flex flex-col gap-5">
            {secondary.map(coach => (
              <Link
                key={coach.slug}
                to={`/coach/${coach.slug}`}
                className="group relative h-[230px] md:h-[290px] overflow-hidden border border-border bg-background-secondary"
              >
                <img
                  src={coach.cover}
                  alt={coach.name}
                  className="absolute inset-0 h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-6">
                  <span className="font-display uppercase tracking-[0.15em] text-[10px] text-ivory bg-background-secondary border border-border px-2.5 py-1">
                    {coach.sport}
                  </span>
                  <h4 className="mt-3 font-display text-ivory text-xl md:text-2xl tracking-tight">
                    {coach.name}
                  </h4>
                  <p className="mt-1 font-body text-sm text-foreground-muted">
                    {coach.city} · €{coach.pricePerSession}/session
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
