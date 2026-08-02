import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Reveal, useParallax } from '@/components/Reveal';

export function HeroSection() {
  const bgRef = useParallax<HTMLImageElement>(0.15);
  return (
    <section className="relative w-full h-[92vh] min-h-[640px] overflow-hidden bg-background">
      {/* Background image — indoor padel courts */}
      <img
        ref={bgRef}
        src="https://images.pexels.com/photos/38155778/pexels-photo-38155778/free-photo-of-indoor-padel-tennis-courts-with-blue-surface.jpeg?auto=compress&cs=tinysrgb&w=2400"
        alt="Indoor padel courts with bright blue playing surface"
        className="absolute inset-0 h-full w-full object-cover object-center will-change-transform"
      />
      {/* Scrim behind the caption block only — text never sits on a raw photo */}
      <div className="absolute inset-x-0 bottom-0 h-[70%] scrim-photo" />

      {/* Content — bottom left */}
      <div className="relative z-10 h-full container flex flex-col justify-end pb-24 md:pb-32">
        <Reveal className="max-w-3xl">
          <h1

            className="mt-8 font-display text-on-photo tracking-tight"
            style={{ fontSize: 'clamp(44px, 7.5vw, 96px)', lineHeight: 0.92 }}
          >
            Built for those who<br />take sport seriously.
          </h1>

          <div className="mt-12 flex flex-wrap items-center gap-3">
            <Link to="/search">
              <Button variant="glass" size="lg" className="tracking-[0.12em] h-12 px-7">
                Find a Coach
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button
                variant="glass"
                size="lg"
                className="tracking-[0.12em] h-12 px-7"
              >
                List Your Profile →
              </Button>
            </Link>
          </div>
        </Reveal>


        {/* Scroll indicator */}
        <div className="absolute bottom-6 right-6 md:right-10 hidden md:flex flex-col items-center gap-2 text-on-photo/80">
          <div className="h-10 w-px bg-[#F7F4EE]/50" />
          <span className="font-display uppercase tracking-[0.2em] text-[10px]">
            Scroll to explore
          </span>
        </div>
      </div>
    </section>
  );
}
