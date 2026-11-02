import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, X, Calendar, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { db } from '@/lib/db';
import { isUuid } from '@/lib/slug';
import { longDate } from '@/lib/events';
import { useLanguage } from '@/context/LanguageContext';


type BookmarkRow = {
  id: string;
  target_type: 'coach' | 'event' | 'session' | 'club';
  target_id: string;
  created_at: string;
};

type EventMini = { id: string; slug: string; title: string; starts_on: string; ends_on: string | null; venue: string | null; district: string | null };

type CoachRow = {
  id: string;
  sport: string | null;
  profiles: { full_name: string | null; avatar_url: string | null; city: string | null } | null;
};

const Bookmarks = () => {
  const { user, profile, loading } = useAuth();
  const { t, lang } = useLanguage();
  const [events, setEvents] = useState<Record<string, EventMini>>({});
  const [bookmarks, setBookmarks] = useState<BookmarkRow[]>([]);
  const [coaches, setCoaches] = useState<Record<string, CoachRow>>({});
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    if (!user) return;
    const { data: bms } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('athlete_id', user.id)
      .order('created_at', { ascending: false });
    const rows = (bms ?? []) as BookmarkRow[];
    setBookmarks(rows);

    const eventIds = rows.filter(b => b.target_type === 'event' && isUuid(b.target_id)).map(b => b.target_id);
    if (eventIds.length) {
      const { data } = await db.from('events').select('id, slug, title, starts_on, ends_on, venue, district').in('id', eventIds);
      setEvents(Object.fromEntries(((data ?? []) as EventMini[]).map(e => [e.id, e])));
    } else {
      setEvents({});
    }

    const coachIds = rows.filter(b => b.target_type === 'coach').map(b => b.target_id);
    if (coachIds.length) {
      const { data } = await supabase
        .from('coach_profiles')
        .select('id, sport, profiles!coach_profiles_id_fkey(full_name, avatar_url, city)')
        .in('id', coachIds);
      const map: Record<string, CoachRow> = {};
      (data ?? []).forEach((c: any) => { map[c.id] = c; });
      setCoaches(map);
    } else {
      setCoaches({});
    }
  };

  useEffect(() => { refresh(); }, [user]);

  const remove = async (b: BookmarkRow) => {
    if (busy) return;
    setBusy(true);
    const { error } = await supabase.from('bookmarks').delete().eq('id', b.id);
    if (error) toast.error(error.message);
    else { toast.success(t.dashbookmarks_removed); refresh(); }
    setBusy(false);
  };

  if (loading || !profile) return <div className="text-muted-foreground p-6">{t.dashbookmarks_loading}</div>;
  if (profile.role !== 'athlete') {
    return <div className="text-muted-foreground p-6">{t.dashbookmarks_athlete_only}</div>;
  }

  const coachBookmarks = bookmarks.filter(b => b.target_type === 'coach');
  const eventBookmarks = bookmarks.filter(b => b.target_type === 'event');

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-5xl md:text-6xl">{t.dashbookmarks_title}</h1>
        <p className="text-muted-foreground mt-1">{t.dashbookmarks_sub}</p>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-xl uppercase tracking-[0.02em]">{t.dashbookmarks_coaches}</h2>
        {coachBookmarks.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.dashbookmarks_no_coaches}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {coachBookmarks.map(b => {
              const c = coaches[b.target_id];
              return (
                <div key={b.id} className="surface p-4 flex items-center gap-4">
                  <img
                    src={c?.profiles?.avatar_url || '/placeholder.svg'}
                    alt={`Profile photo of ${c?.profiles?.full_name || t.dashbookmarks_coach}`}
                    className="h-14 w-14 object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <Link to={`/coaches/${b.target_id}`} className="font-display text-lg hover:text-primary transition-colors block truncate">
                      {c?.profiles?.full_name || t.dashbookmarks_coach}
                    </Link>
                    <p className="text-sm text-muted-foreground truncate">
                      {c?.sport ?? '—'}{c?.profiles?.city ? ` · ${c.profiles.city}` : ''}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove(b)} aria-label={t.dashbookmarks_remove_aria}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl uppercase tracking-[0.02em]">{t.dashbookmarks_events}</h2>
        {eventBookmarks.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.dashbookmarks_no_events}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {eventBookmarks.map(b => {
              const ev = events[b.target_id];
              return (
                <div key={b.id} className="surface p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <Link to={ev ? `/events/${ev.slug}` : '/events'} className="font-display text-lg hover:text-primary transition-colors block truncate">
                      {ev?.title ?? t.dashbookmarks_event}
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
                      {ev?.starts_on && <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {longDate(ev.starts_on, ev.ends_on, lang)}</span>}
                      {(ev?.venue || ev?.district) && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {[ev.venue, ev.district].filter(Boolean).join(' · ')}</span>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove(b)} aria-label={t.dashbookmarks_remove_aria}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        {bookmarks.filter(b => b.target_type === 'session' || b.target_type === 'club').map(b => (
          <div key={b.id} className="surface p-4 flex items-center gap-4">
            <Link to={b.target_type === 'club' ? `/clubs/${b.target_id}` : '/discover'} className="flex-1 text-primary hover:underline">
              {b.target_type === 'club' ? t.disc_clubs : t.disc_sessions}
            </Link>
            <Button variant="ghost" size="icon" onClick={() => remove(b)} aria-label={t.dashbookmarks_remove_aria}><X className="h-4 w-4" /></Button>
          </div>
        ))}
      </section>

      {bookmarks.length === 0 && (
        <div className="surface p-8 text-center">
          <Bookmark className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">{t.dashbookmarks_empty}</p>
        </div>
      )}
    </div>
  );
};

export default Bookmarks;
