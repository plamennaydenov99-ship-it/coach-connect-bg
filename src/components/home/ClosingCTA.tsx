import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/Reveal';

export function ClosingCTA() {
  return (
    <section className="relative bg-background overflow-hidden border-t border-border">
      <Reveal className="relative container py-36 md:py-52 text-center max-w-3xl">
        {/* Thin accent line top */}
        <div className="h-px w-16 bg-crest mx-auto mb-12" />

        <span className="label-eyebrow text-gold">Join Zenit</span>

        <h2
          className="mt-8 font-display text-foreground tracking-tight"
          style={{ fontSize: 'clamp(36px, 5.5vw, 68px)', lineHeight: 1 }}
        >
          Every athlete has<br />a next level.
        </h2>

        <p className="mt-10 font-body text-foreground-muted text-base md:text-lg leading-relaxed max-w-xl mx-auto">
          Find the coach who gets you there — whatever your sport, whatever your
          starting point.
        </p>



        <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
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
