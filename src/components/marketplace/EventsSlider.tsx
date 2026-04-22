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
        className="relative overflow-hidden rounded-xl border border-border bg-card"
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
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
                <span className="absolute right-4 top-4 rounded-md bg-background/60 px-2 py-0.5 text-xs text-muted-foreground backdrop-blur">
                  Sponsored
                </span>

                <div className="absolute inset-x-0 bottom-0 p-6 md:p-10">
                  <Badge className="bg-primary text-primary-foreground hover:bg-primary">
                    {ev.sport}
                  </Badge>
                  <h3 className="mt-3 font-display text-2xl md:text-4xl">{ev.name}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" /> {ev.date}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" /> {ev.city}
                    </span>
                  </div>
                  <p className="mt-3 max-w-2xl text-sm md:text-base text-foreground/80">
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
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-border bg-background/70 p-2 text-foreground backdrop-blur transition hover:bg-background"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={next}
          aria-label="Next slide"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-border bg-background/70 p-2 text-foreground backdrop-blur transition hover:bg-background"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Dots */}
      <div className="mt-4 flex justify-center gap-2">
        {EVENTS.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2 rounded-full transition-all ${
              i === index ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/40 hover:bg-muted-foreground'
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
