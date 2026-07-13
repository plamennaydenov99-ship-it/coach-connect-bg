import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/Reveal';

export function ClosingCTA() {
  return (
    <section className="relative bg-background overflow-hidden border-t border-border">
      {/* Subtle background texture */}
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 18px)',
        }}
      />

      <Reveal className="relative container py-28 md:py-40 text-center max-w-3xl">
        {/* Thin gold line top */}
        <div className="h-px w-16 bg-navy mx-auto mb-10" />

        <span className="label-eyebrow text-gold">Join Zenit</span>

        <h2
          className="mt-6 font-display text-foreground tracking-tight"
          style={{ fontSize: 'clamp(36px, 5.5vw, 68px)', lineHeight: 1 }}
        >
          Not everyone trains<br />with the best.
        </h2>

        <p className="mt-8 font-body text-foreground-muted text-base md:text-lg leading-relaxed max-w-xl mx-auto">
          Zenit is for athletes who refuse to plateau.
          Find your coach. Raise your level.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link to="/search">
            <Button size="lg" className="tracking-[0.12em] h-12 px-7">
              Find Your Coach
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button
              variant="outline"
              size="lg"
              className="tracking-[0.12em] h-12 px-7 border-foreground-subtle text-foreground hover:border-gold hover:text-foreground"
            >
              I'm a Coach →
            </Button>
          </Link>
        </div>

        <p className="mt-12 font-display uppercase tracking-[0.2em] text-[11px] text-foreground-subtle">
          Free to join · No commission · Global reach
        </p>
      </Reveal>
    </section>
  );
}
