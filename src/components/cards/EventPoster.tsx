import { Poster } from '@/components/cards/Poster';
import { useLanguage } from '@/context/LanguageContext';
import { posterDate, type EventRow } from '@/lib/events';
import { sportLabel } from '@/lib/trending';

/** An event as a poster: giant date, title, where, and what it costs. */
export function EventPoster({ event, index }: { event: EventRow; index: number }) {
  const { t, lang } = useLanguage();
  const { big, small } = posterDate(event.starts_on, event.ends_on, lang);
  const kind = (t as Record<string, string>)[`rd_k_${event.kind}`] ?? event.kind;
  const chips = [kind, event.sport ? sportLabel(event.sport, lang) : null].filter(Boolean) as string[];
  const place = [event.venue, event.district].filter(Boolean).join(' · ');
  return (
    <Poster
      index={index}
      to={`/events/${event.slug}`}
      cta={event.kind === 'camp' ? t.tn_camp_view : t.tn_event_view}
      big={big}
      small={small}
      chips={chips}
      title={event.title}
      place={place || undefined}
      foot={(event.price_text || event.recurrence) ? (
        <div className="space-y-0.5 font-semibold">
          {event.price_text && <p>{event.price_text}</p>}
          {event.recurrence && <p className="font-normal opacity-90">{event.recurrence}</p>}
        </div>
      ) : null}
    />
  );
}
