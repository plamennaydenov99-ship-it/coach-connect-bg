import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, MapPin } from 'lucide-react';

import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { PageHeader } from '@/components/layout/PageHeader';
import { chip, lift } from '@/lib/ui';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EVENTS } from '@/lib/events';
import { BookmarkButton } from '@/components/BookmarkButton';
import { useLanguage } from '@/context/LanguageContext';

interface CoachEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
}

export default function Events() {
  const { t } = useLanguage();
  const [coachEvents, setCoachEvents] = useState<CoachEvent[]>([]);

  useEffect(() => {
    supabase
      .from('coach_events')
      .select('id, title, description, event_date, location')
      .gte('event_date', new Date().toISOString().slice(0, 10))
      .order('event_date', { ascending: true })
      .then(({ data }) => setCoachEvents((data as any) ?? []));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <PublicNav />

      <main className="flex-1">
        <PageHeader title={t.events_page_title} sub={t.events_page_sub} tone="clay" />
        <div className="container py-12 md:py-16">

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {EVENTS.map(ev => (
            <article
              key={ev.id}
              className={`surface overflow-hidden ${lift}`}
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                <img
                  src={ev.image}
                  alt={ev.name}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <Badge className="bg-primary text-primary-foreground hover:bg-primary">
                    {ev.sport}
                  </Badge>
                  <BookmarkButton targetType="event" targetId={String(ev.id)} variant="icon" />
                </div>
                <h2 className="t-plain mt-3 text-xl">{ev.name}</h2>
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
                  {t.events_view_event}
                </Button>
              </div>
            </article>
          ))}
        </div>

        {coachEvents.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-6 text-4xl md:text-5xl">{t.events_by_coaches}</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {coachEvents.map(ev => (
                <article key={ev.id} className="surface p-5">
                  <h3 className="t-plain text-xl">{ev.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" /> {new Date(ev.event_date).toLocaleDateString()}
                    </span>
                    {ev.location && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" /> {ev.location}
                      </span>
                    )}
                  </div>
                  {ev.description && <p className="mt-3 text-sm text-muted-foreground">{ev.description}</p>}
                </article>
              ))}
            </div>
          </section>
        )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
