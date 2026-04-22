import { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar, MapPin } from 'lucide-react';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

type EventItem = {
  id: number;
  name: string;
  sport: string;
  date: string;
  city: string;
  description: string;
  image: string;
};

const EVENTS: EventItem[] = [
  {
    id: 1,
    name: 'City 10K Marathon',
    sport: 'Running',
    date: '15 June',
    city: 'Sofia',
    description: 'Race through the heart of the city in this iconic 10K road run.',
    image: 'https://picsum.photos/900/400?random=1',
  },
  {
    id: 2,
    name: 'Summer Padel Open',
    sport: 'Padel',
    date: '22 June',
    city: 'Sofia',
    description: 'Open singles and doubles tournament with prizes for every level.',
    image: 'https://picsum.photos/900/400?random=2',
  },
  {
    id: 3,
    name: '5-a-Side Football Cup',
    sport: 'Football',
    date: '29 June',
    city: 'Sofia',
    description: 'Grab your squad and battle it out in this fast-paced summer cup.',
    image: 'https://picsum.photos/900/400?random=3',
  },
  {
    id: 4,
    name: 'Boxing White Collar Night',
    sport: 'Boxing',
    date: '6 July',
    city: 'Sofia',
    description: 'An electric evening of amateur bouts and live ringside entertainment.',
    image: 'https://picsum.photos/900/400?random=4',
  },
  {
    id: 5,
    name: 'Tennis Club Championship',
    sport: 'Tennis',
    date: '13 July',
    city: 'Sofia',
    description: 'Compete across multiple draws on premium clay courts.',
    image: 'https://picsum.photos/900/400?random=5',
  },
  {
    id: 6,
    name: 'CrossFit Open Challenge',
    sport: 'CrossFit',
    date: '20 July',
    city: 'Sofia',
    description: 'Test your limits across three workouts in a single high-energy day.',
    image: 'https://picsum.photos/900/400?random=6',
  },
];

export default function Events() {
  const [index, setIndex] = useState(0);

  const next = useCallback(() => setIndex(i => (i + 1) % EVENTS.length), []);
  const prev = useCallback(() => setIndex(i => (i - 1 + EVENTS.length) % EVENTS.length), []);

  useEffect(() => {
    const t = setInterval(next, 4000);
    return () => clearInterval(t);
  }, [next]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav />

      <main className="container py-10 md:py-14">
        <div className="mb-8 md:mb-10">
          <h1 className="font-display text-4xl md:text-5xl">Upcoming events</h1>
          <p className="mt-2 text-muted-foreground">
            Tournaments, races and meet-ups happening near you.
          </p>
        </div>

        {/* Slider */}
        <section
          aria-label="Featured events"
          className="relative overflow-hidden rounded-xl border border-border bg-card"
        >
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {EVENTS.map(ev => (
              <article
                key={ev.id}
                className="relative w-full shrink-0"
                aria-roledescription="slide"
              >
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
                    <h2 className="mt-3 font-display text-2xl md:text-4xl">{ev.name}</h2>
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

          {/* Arrows */}
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
        </section>

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

        {/* Grid */}
        <section className="mt-14">
          <h2 className="font-display text-2xl md:text-3xl">Browse all events</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {EVENTS.map(ev => (
              <Card
                key={ev.id}
                className="overflow-hidden border-border bg-card transition hover:border-primary/50"
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <img
                    src={ev.image}
                    alt={ev.name}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    loading="lazy"
                  />
                  <span className="absolute right-2 top-2 rounded-md bg-background/70 px-2 py-0.5 text-[10px] text-muted-foreground backdrop-blur">
                    Sponsored
                  </span>
                </div>
                <div className="p-5">
                  <Badge className="bg-primary text-primary-foreground hover:bg-primary">
                    {ev.sport}
                  </Badge>
                  <h3 className="mt-3 font-display text-xl">{ev.name}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" /> {ev.date}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" /> {ev.city}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" className="mt-4 w-full">
                    View event
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
