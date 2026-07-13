import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  const scrollToMatch = () => {
    document.getElementById('matching-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="relative w-full min-h-[70vh] flex items-center overflow-hidden bg-background">
      {/* Background image */}
      <img
        src="https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=1600&q=80"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover opacity-[0.08] grayscale"
      />
      {/* Diagonal line texture */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 14px)',
        }}
      />
      {/* Darkening overlay */}
      <div className="absolute inset-0 bg-background/60" />

      <div className="container relative z-10 py-20 md:py-28">
        <div className="max-w-2xl">
          <span className="label-eyebrow text-gold">Nice · Monaco · Sofia</span>
          <h1
            className="mt-5 font-display text-foreground tracking-tight"
            style={{ fontSize: 'clamp(48px, 7vw, 80px)', lineHeight: 0.9 }}
          >
            CONNECT.<br />TRAIN.<br />COMPETE.
          </h1>
          <p className="mt-6 text-foreground-muted font-body text-base max-w-md">
            Find verified coaches, join clubs, discover camps and events — all in one place.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/search">
              <Button size="lg" className="tracking-[0.1em]">
                Find a Coach <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              onClick={scrollToMatch}
              className="tracking-[0.1em] border-foreground-subtle text-foreground-muted hover:border-gold hover:text-foreground"
            >
              AI Match Me <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// Backward-compat alias — Index used to import SplitHero
export const SplitHero = HeroSection;
