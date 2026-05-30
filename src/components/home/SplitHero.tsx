import { Link } from 'react-router-dom';
import { ArrowRight, Zap } from 'lucide-react';

export function SplitHero() {
  return (
    <section className="relative w-full" style={{ minHeight: 'calc(100vh - 64px - 40px)' }}>
      <div className="flex h-full min-h-[calc(100vh-104px)] flex-col md:flex-row">
        {/* Athlete panel */}
        <Link
          to="/search"
          className="group relative flex flex-1 items-center justify-center overflow-hidden bg-background min-h-[50vh] md:min-h-0 transition-[flex] duration-500 md:hover:flex-[1.15]"
        >
          <img
            src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1600&q=80"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-25 grayscale transition-all duration-700 group-hover:opacity-50 group-hover:grayscale-0 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background/70 to-background/30" />
          <div className="relative z-10 px-8 md:px-16 max-w-xl">
            <span className="label-eyebrow text-primary">Athlete Mode</span>
            <h2
              className="mt-4 font-display text-[18vw] md:text-[7vw] leading-[0.85] text-foreground transition-colors group-hover:text-primary"
            >
              I AM AN<br />ATHLETE
            </h2>
            <p className="mt-5 text-muted-foreground max-w-sm">
              Discover certified coaches, join clubs, and find events near you.
            </p>
            <div className="mt-8 inline-flex items-center gap-3 border border-primary text-primary px-5 py-3 font-condensed font-bold uppercase tracking-widest text-sm transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              Enter Athlete App <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </Link>

        {/* Divider with logo */}
        <div className="relative hidden md:flex w-px bg-border items-center justify-center">
          <div className="absolute z-20 flex h-14 w-14 items-center justify-center bg-background border border-border">
            <Zap className="h-6 w-6 text-foreground" strokeWidth={2.5} />
          </div>
        </div>

        {/* Coach panel */}
        <Link
          to="/dashboard"
          className="group relative flex flex-1 items-center justify-center overflow-hidden bg-card min-h-[50vh] md:min-h-0 transition-[flex] duration-500 md:hover:flex-[1.15]"
        >
          <img
            src="https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1600&q=80"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-20 grayscale transition-all duration-700 group-hover:opacity-50 group-hover:grayscale-0 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-bl from-card via-card/70 to-card/30" />
          <div className="relative z-10 px-8 md:px-16 max-w-xl">
            <span className="label-eyebrow text-coach">Coach / Club Mode</span>
            <h2
              className="mt-4 font-display text-[18vw] md:text-[7vw] leading-[0.85] text-foreground transition-colors group-hover:text-coach"
            >
              I AM A<br />COACH / CLUB
            </h2>
            <p className="mt-5 text-muted-foreground max-w-sm">
              Build your profile, grow your client base, and manage bookings.
            </p>
            <div className="mt-8 inline-flex items-center gap-3 border border-coach text-coach px-5 py-3 font-condensed font-bold uppercase tracking-widest text-sm transition-colors group-hover:bg-coach group-hover:text-coach-foreground">
              Enter Coach Dashboard <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
