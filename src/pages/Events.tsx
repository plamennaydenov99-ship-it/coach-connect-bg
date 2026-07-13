import { Calendar, MapPin } from 'lucide-react';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EVENTS } from '@/lib/events';

export default function Events() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <PublicNav />

      <main className="flex-1 container py-10 md:py-14">
        <header className="mb-8 md:mb-10">
          <h1 className="font-display text-4xl md:text-5xl">All events</h1>
          <p className="mt-2 text-muted-foreground">
            Tournaments, races and meet-ups happening near you.
          </p>
        </header>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {EVENTS.map(ev => (
            <article
              key={ev.id}
              className="surface overflow-hidden transition hover:border-gold/50"
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
                <h2 className="mt-3 font-display text-xl">{ev.name}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" /> {ev.date}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" /> {ev.city}
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{ev.description}</p>
                <Button variant="outline" size="sm" className="mt-4 w-full">
                  View event
                </Button>
              </div>
            </article>
          ))}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
