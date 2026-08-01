import { Link } from 'react-router-dom';
import { Reveal } from '@/components/Reveal';

export function FeaturedCoaches() {
  return (
    <section className="bg-background py-32 md:py-44 border-t border-border">
      <div className="container">
        <div className="mb-16 md:mb-20">
          <span className="label-eyebrow text-gold">Early access</span>
          <h2
            className="mt-4 font-display text-foreground tracking-tight"
            style={{ fontSize: 'clamp(32px, 4.5vw, 56px)', lineHeight: 1 }}
          >
            Coaches: coming soon.
          </h2>
        </div>

        <Reveal className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="border border-border bg-background-secondary p-8 md:p-12 flex flex-col">
            <span className="font-display uppercase tracking-[0.15em] text-[11px] text-foreground-subtle">
              For athletes
            </span>
            <h3 className="mt-4 font-display text-foreground text-2xl md:text-3xl tracking-tight">
              Join the waitlist.
            </h3>
            <p className="mt-4 font-body text-foreground-muted leading-relaxed">
              We're onboarding our first coaches now. Sign up early and we'll match you
              with a coach as soon as they go live in your sport.
            </p>
            <Link
              to="/register"
              className="mt-8 inline-flex self-start font-display uppercase tracking-[0.15em] text-sm text-foreground border-b border-copper pb-1 hover:text-gold transition-colors"
            >
              Join early access →
            </Link>
          </div>

          <div className="border border-border bg-background-secondary p-8 md:p-12 flex flex-col">
            <span className="font-display uppercase tracking-[0.15em] text-[11px] text-foreground-subtle">
              For coaches &amp; clubs
            </span>
            <h3 className="mt-4 font-display text-foreground text-2xl md:text-3xl tracking-tight">
              Apply to be listed.
            </h3>
            <p className="mt-4 font-body text-foreground-muted leading-relaxed">
              Founding coaches get first placement on the platform. Tell us about your
              coaching and we'll get you set up.
            </p>
            <Link
              to="/for-coaches"
              className="mt-8 inline-flex self-start font-display uppercase tracking-[0.15em] text-sm text-foreground border-b border-copper pb-1 hover:text-gold transition-colors"
            >
              Apply as a coach →
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
