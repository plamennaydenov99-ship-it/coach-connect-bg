import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { PageHeader } from '@/components/layout/PageHeader';
import { Poster } from '@/components/cards/Poster';
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

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EVENTS.map((ev, i) => {
            const [day, ...month] = ev.date.split(' ');
            return (
              <Poster key={ev.id} index={i} big={day} small={month.join(' ')} chips={[ev.sport]} title={ev.name} place={ev.city}
                foot={<div className="space-y-3"><p className="line-clamp-2 max-w-[34ch] opacity-90">{ev.description}</p><span className="inline-flex bg-[#F3EDE2] text-foreground"><BookmarkButton targetType="event" targetId={String(ev.id)} variant="icon" /></span></div>} />
            );
          })}
        </div>

        {coachEvents.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 text-4xl md:text-6xl">{t.events_by_coaches}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {coachEvents.map((ev, i) => {
                const d = new Date(ev.event_date);
                return <Poster key={ev.id} index={i + 1} big={String(d.getDate())} small={d.toLocaleDateString(undefined, { month: 'long' })} title={ev.title} place={ev.location ?? undefined}
                  foot={ev.description ? <p className="line-clamp-2 max-w-[34ch] opacity-90">{ev.description}</p> : null} />;
              })}
            </div>
          </section>
        )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
