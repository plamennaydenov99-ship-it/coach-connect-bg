import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import { Users, ChevronRight } from 'lucide-react';

interface ClientRow {
  id: string;
  athlete_id: string;
  athlete: { full_name: string | null; avatar_url: string | null; city: string | null } | null;
  sessions: number;
  lastSession: string | null;
}

const Clients = () => {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      const { data: rels } = await supabase
        .from('coach_clients')
        .select('id, athlete_id, created_at, athlete:profiles!coach_clients_athlete_id_fkey(full_name, avatar_url, city)')
        .eq('coach_id', user.id)
        .order('created_at', { ascending: false });

      const { data: bookings } = await supabase
        .from('bookings')
        .select('athlete_id, slot:availability_slots!bookings_slot_id_fkey(date)')
        .eq('coach_id', user.id);

      const stats = new Map<string, { count: number; last: string | null }>();
      ((bookings as any[]) ?? []).forEach((b) => {
        const cur = stats.get(b.athlete_id) ?? { count: 0, last: null };
        cur.count += 1;
        const d = b.slot?.date ?? null;
        if (d && (!cur.last || d > cur.last)) cur.last = d;
        stats.set(b.athlete_id, cur);
      });

      setRows(((rels as any[]) ?? []).map((r) => ({
        id: r.id,
        athlete_id: r.athlete_id,
        athlete: r.athlete,
        sessions: stats.get(r.athlete_id)?.count ?? 0,
        lastSession: stats.get(r.athlete_id)?.last ?? null,
      })));
      setLoading(false);
    };
    load();
  }, [user]);

  if (profile && profile.role !== 'coach') {
    return <p className="text-muted-foreground">{t.clients_coach_only}</p>;
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-3xl">{t.clients_title}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t.clients_sub}</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">{t.clients_loading}</p>
      ) : rows.length === 0 ? (
        <div className="border border-border rounded-lg p-10 text-center">
          <Users className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">{t.clients_empty}</p>
        </div>
      ) : (
        <div className="border border-border rounded-lg divide-y divide-border">
          {rows.map((r) => (
            <Link
              key={r.id}
              to={`/dashboard/clients/${r.id}`}
              className="flex items-center gap-4 p-4 hover:bg-muted/40 transition-colors"
            >
              {r.athlete?.avatar_url ? (
                <img
                  src={r.athlete.avatar_url}
                  alt={r.athlete.full_name ?? t.clients_unnamed}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm">
                  {(r.athlete?.full_name ?? '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{r.athlete?.full_name ?? t.clients_unnamed}</p>
                <p className="text-xs text-muted-foreground">
                  {r.sessions} {t.clients_sessions}
                  {r.lastSession ? ` · ${t.clients_last} ${new Date(r.lastSession).toLocaleDateString()}` : ''}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Clients;
