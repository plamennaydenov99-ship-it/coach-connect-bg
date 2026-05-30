import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EVENTS } from '@/lib/events';

export function EventsSlider() {
  const [index, setIndex] = useState(0);

  const next = useCallback(() => setIndex(i => (i + 1) % EVENTS.length), []);
  const prev = useCallback(() => setIndex(i => (i - 1 + EVENTS.length) % EVENTS.length), []);

  useEffect(() => {
    const t = setInterval(next, 4000);
    return () => clearInterval(t);
  }, [next]);

  return (
    <section className="container py-16 md:py-20">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display">Upcoming events</h2>
          <p className="text-muted-foreground mt-2">
            Tournaments, races and meet-ups happening near you.
          </p>
        </div>
        <Link to="/events" className="hidden md:block">
          <Button variant="ghost">
            View all events <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>

      {/* Slider */}
      <div
        aria-label="Featured events"
        className="relative overflow-hidden border border-border bg-card rounded-sm"
      >
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {EVENTS.map(ev => (
            <article key={ev.id} className="relative w-full shrink-0" aria-roledescription="slide">
              <div className="relative aspect-[21/9] w-full overflow-hidden md:aspect-[21/8]">
                <img
                  src={ev.image}
                  alt={ev.name}
                  className="h-full w-full object-cover grayscale"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
                <span className="absolute right-4 top-4 bg-background-tertiary px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] font-display text-foreground-muted rounded-sm">
                  Sponsored
                </span>

                <div className="absolute inset-x-0 bottom-0 p-6 md:p-10">
                  <Badge className="bg-coach-accent text-coach-accent-glow hover:bg-coach-accent uppercase tracking-[0.12em] font-display rounded-sm">
                    {ev.sport}
                  </Badge>
                  <h3 className="mt-3 font-display text-2xl md:text-4xl text-foreground">{ev.name}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-foreground-muted font-body">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" /> {ev.date}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" /> {ev.city}
                    </span>
                  </div>
                  <p className="mt-3 max-w-2xl text-sm md:text-base text-foreground-muted font-body">
                    {ev.description}
                  </p>
                  <Button className="mt-5">View event</Button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <button
          onClick={prev}
          aria-label="Previous slide"
          className="absolute left-3 top-1/2 -translate-y-1/2 border border-border-hover bg-background/80 p-2 text-foreground hover:bg-background rounded-sm"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={next}
          aria-label="Next slide"
          className="absolute right-3 top-1/2 -translate-y-1/2 border border-border-hover bg-background/80 p-2 text-foreground hover:bg-background rounded-sm"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Dots */}
      <div className="mt-4 flex justify-center gap-1.5">
        {EVENTS.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-0.5 transition-all ${
              i === index ? 'w-8 bg-primary' : 'w-4 bg-border-hover hover:bg-foreground-muted'
            }`}
          />
        ))}
      </div>

      <div className="mt-6 flex justify-center md:hidden">
        <Link to="/events">
          <Button variant="outline">
            View all events <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
