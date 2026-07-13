import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative w-full h-[92vh] min-h-[640px] overflow-hidden bg-background">
      {/* Background image — athlete in motion */}
      <img
        src="https://images.unsplash.com/photo-1517649763962-0c623066013b?w=2400&q=85"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover grayscale"
      />
      {/* Dark gradient scrim — stronger for legibility over photo */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/55" />
      <div className="absolute inset-0 bg-background/30" />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 14px)',
        }}
      />

      {/* Content — bottom left */}
      <div className="relative z-10 h-full container flex flex-col justify-end pb-20 md:pb-28">
        <div className="max-w-3xl">
          <span className="label-eyebrow text-gold">
            Nice · Monaco · Sofia
          </span>

          <h1
            className="mt-6 font-display text-foreground tracking-tight"
            style={{ fontSize: 'clamp(44px, 7.5vw, 96px)', lineHeight: 0.92 }}
          >
            Built for those who<br />take sport seriously.
          </h1>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link to="/search">
              <Button size="lg" className="tracking-[0.12em] h-12 px-7">
                Find a Coach
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button
                variant="outline"
                size="lg"
                className="tracking-[0.12em] h-12 px-7 border-foreground-subtle text-foreground hover:border-gold hover:text-foreground"
              >
                List Your Profile →
              </Button>
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 right-6 md:right-10 hidden md:flex flex-col items-center gap-2 text-foreground-subtle">
          <div className="h-10 w-px bg-foreground-subtle/60" />
          <span className="font-display uppercase tracking-[0.2em] text-[10px]">
            Scroll to explore
          </span>
        </div>
      </div>
    </section>
  );
}
