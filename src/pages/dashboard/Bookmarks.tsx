import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, X, Calendar, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EVENTS } from '@/lib/events';

type BookmarkRow = {
  id: string;
  target_type: 'coach' | 'event';
  target_id: string;
  created_at: string;
};

type CoachRow = {
  id: string;
  sport: string | null;
  profiles: { full_name: string | null; avatar_url: string | null; city: string | null } | null;
};

const Bookmarks = () => {
  const { user, profile, loading } = useAuth();
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
    else { toast.success('Removed'); refresh(); }
    setBusy(false);
  };

  if (loading || !profile) return <div className="text-muted-foreground p-6">Loading…</div>;
  if (profile.role !== 'athlete') {
    return <div className="text-muted-foreground p-6">Bookmarks are only available for athletes.</div>;
  }

  const coachBookmarks = bookmarks.filter(b => b.target_type === 'coach');
  const eventBookmarks = bookmarks.filter(b => b.target_type === 'event');

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="font-display text-3xl">Bookmarks</h1>
        <p className="text-muted-foreground mt-1">Your saved coaches and events.</p>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-xl uppercase tracking-[0.1em]">Coaches</h2>
        {coachBookmarks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No coaches bookmarked yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {coachBookmarks.map(b => {
              const c = coaches[b.target_id];
              return (
                <div key={b.id} className="surface p-4 flex items-center gap-4">
                  <img
                    src={c?.profiles?.avatar_url || `https://i.pravatar.cc/100?u=${b.target_id}`}
                    alt=""
                    className="h-14 w-14 object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <Link to={`/coach/${b.target_id}`} className="font-display text-lg hover:text-gold transition-colors block truncate">
                      {c?.profiles?.full_name || 'Coach'}
                    </Link>
                    <p className="text-sm text-muted-foreground truncate">
                      {c?.sport ?? '—'}{c?.profiles?.city ? ` · ${c.profiles.city}` : ''}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove(b)} aria-label="Remove bookmark">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl uppercase tracking-[0.1em]">Events</h2>
        {eventBookmarks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events bookmarked yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {eventBookmarks.map(b => {
              const ev = EVENTS.find(e => String(e.id) === b.target_id);
              return (
                <div key={b.id} className="surface p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <Link to="/events" className="font-display text-lg hover:text-gold transition-colors block truncate">
                      {ev?.name ?? 'Event'}
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
                      {ev?.date && <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {ev.date}</span>}
                      {ev?.city && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {ev.city}</span>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove(b)} aria-label="Remove bookmark">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {bookmarks.length === 0 && (
        <div className="surface p-8 text-center">
          <Bookmark className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Start bookmarking coaches and events to see them here.</p>
        </div>
      )}
    </div>
  );
};

export default Bookmarks;
