import { Link } from 'react-router-dom';
import { ArrowRight, Zap } from 'lucide-react';

export function SplitHero() {
  return (
    <section className="relative w-full">
      <div className="flex flex-col md:flex-row md:h-[80vh]">
        {/* Athlete panel */}
        <Link
          to="/search"
          className="group relative flex flex-1 items-center justify-center overflow-hidden min-h-[50vh] md:min-h-0 transition-[flex] duration-700"
          style={{ backgroundColor: '#0A0E14' }}
        >
          {/* Diagonal line texture */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 14px)',
            }}
          />
          {/* Navy underlay (revealed on hover) */}
          <div className="absolute inset-0 bg-athlete opacity-0 transition-opacity duration-700 group-hover:opacity-40" />
          <img
            src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1600&q=80"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-10 grayscale transition-all duration-700 group-hover:opacity-25 group-hover:scale-105"
          />
          <div className="relative z-10 px-8 md:px-16 max-w-xl">
            <span className="label-eyebrow text-foreground-muted">Athlete Mode</span>
            <h2 className="mt-4 font-display text-[18vw] md:text-[7vw] leading-[0.85] text-secondary">
              I AM AN<br />ATHLETE
            </h2>
            <p className="mt-5 text-foreground-muted max-w-sm font-body">
              Discover certified coaches, join clubs, and find events near you.
            </p>
            <div className="mt-8 inline-flex items-center gap-3 border border-border-hover text-secondary px-5 py-3 font-display uppercase tracking-[0.15em] text-sm transition-colors group-hover:border-foreground group-hover:text-foreground">
              Enter Athlete App <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </Link>

        {/* Divider with logo */}
        <div className="relative hidden md:flex w-px items-center justify-center" style={{ background: 'hsl(var(--border-hover) / 0.5)' }}>
          <div className="absolute z-20 flex h-14 w-14 items-center justify-center bg-background border border-border-hover">
            <Zap className="h-6 w-6 text-foreground" strokeWidth={2} />
          </div>
        </div>

        {/* Coach panel */}
        <Link
          to="/dashboard"
          className="group relative flex flex-1 items-center justify-center overflow-hidden min-h-[50vh] md:min-h-0 transition-[flex] duration-700"
          style={{ backgroundColor: '#0A120E' }}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 14px)',
            }}
          />
          <div className="absolute inset-0 bg-coach-accent opacity-0 transition-opacity duration-700 group-hover:opacity-40" />
          <img
            src="https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1600&q=80"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-10 grayscale transition-all duration-700 group-hover:opacity-25 group-hover:scale-105"
          />
          <div className="relative z-10 px-8 md:px-16 max-w-xl">
            <span className="label-eyebrow text-foreground-muted">Coach / Club Mode</span>
            <h2 className="mt-4 font-display text-[18vw] md:text-[7vw] leading-[0.85] text-secondary">
              I AM A<br />COACH / CLUB
            </h2>
            <p className="mt-5 text-foreground-muted max-w-sm font-body">
              Build your profile, grow your client base, and manage bookings.
            </p>
            <div className="mt-8 inline-flex items-center gap-3 border border-border-hover text-secondary px-5 py-3 font-display uppercase tracking-[0.15em] text-sm transition-colors group-hover:border-foreground group-hover:text-foreground">
              Enter Coach Dashboard <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
