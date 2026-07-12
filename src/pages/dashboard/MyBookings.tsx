import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Clock, Inbox } from 'lucide-react';

interface Row {
  id: string;
  status: 'pending' | 'confirmed' | 'declined' | 'cancelled';
  note: string | null;
  price: number | null;
  coach_id: string;
  slot: { date: string; start_time: string; end_time: string } | null;
  coach: { full_name: string | null; avatar_url: string | null } | null;
}

const MyBookings = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('bookings')
      .select('id, status, note, price, coach_id, slot:availability_slots!bookings_slot_id_fkey(date, start_time, end_time), coach:profiles!bookings_coach_id_fkey(full_name, avatar_url)')
      .eq('athlete_id', user.id)
      .order('created_at', { ascending: false });
    setRows((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel('bookings-athlete')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `athlete_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">My bookings</h1>
          <p className="text-muted-foreground mt-1">Track your session requests and their status.</p>
        </div>
        <Link to="/search"><Button variant="outline">Find a coach</Button></Link>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="surface p-10 flex flex-col items-center text-center text-muted-foreground">
          <Inbox className="h-8 w-8 mb-3 text-muted-foreground/50" />
          <p>No bookings yet.</p>
          <Link to="/search" className="mt-3"><Button size="sm">Browse coaches</Button></Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map(r => (
            <li key={r.id} className="surface p-5 flex items-center gap-4 justify-between">
              <div className="flex items-center gap-4 min-w-0">
                <img
                  src={r.coach?.avatar_url || `https://i.pravatar.cc/150?u=${r.coach_id}`}
                  alt=""
                  className="h-11 w-11 rounded-full object-cover shrink-0"
                />
                <div className="min-w-0">
                  <Link to={`/coach/${r.coach_id}`} className="font-medium hover:underline">{r.coach?.full_name || 'Coach'}</Link>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {r.slot ? `${new Date(r.slot.date + 'T00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · ${r.slot.start_time.slice(0,5)}–${r.slot.end_time.slice(0,5)}` : 'Slot removed'}
                    {r.price ? ` · €${r.price}` : ''}
                  </p>
                </div>
              </div>
              <span className={`text-xs uppercase tracking-wider px-2 py-1 border shrink-0 ${
                r.status === 'confirmed' ? 'border-primary text-primary' :
                r.status === 'pending' ? 'border-yellow-500/60 text-yellow-500' :
                'border-muted-foreground/30 text-muted-foreground'
              }`}>{r.status}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MyBookings;
