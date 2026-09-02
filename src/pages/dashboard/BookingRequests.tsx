import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Check, X, Clock, MessageSquare, Inbox } from 'lucide-react';
import { toast } from 'sonner';
import { getOrCreateConversation } from '@/lib/messaging';
import { useLanguage } from '@/context/LanguageContext';

interface Row {
  id: string;
  status: 'pending' | 'confirmed' | 'declined' | 'cancelled';
  note: string | null;
  price: number | null;
  created_at: string;
  athlete_id: string;
  slot: { date: string; start_time: string; end_time: string } | null;
  athlete: { full_name: string | null; avatar_url: string | null; city: string | null } | null;
}

const BookingRequests = () => {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('bookings')
      .select('id, status, note, price, created_at, athlete_id, slot:availability_slots!bookings_slot_id_fkey(date, start_time, end_time), athlete:profiles!bookings_athlete_id_fkey(full_name, avatar_url, city)')
      .eq('coach_id', user.id)
      .order('created_at', { ascending: false });
    setRows((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel('bookings-coach')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `coach_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  if (profile && profile.role !== 'coach') {
    return <p className="text-muted-foreground">{t.requests_coach_only}</p>;
  }

  const decide = async (id: string, status: 'confirmed' | 'declined') => {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(status === 'confirmed' ? t.requests_confirmed_toast : t.requests_declined_toast);
    load();
  };

  const message = async (athleteId: string) => {
    if (!user) return;
    try {
      const cid = await getOrCreateConversation(athleteId, user.id);
      navigate(`/dashboard/messages?c=${cid}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const filtered = filter === 'pending' ? rows.filter(r => r.status === 'pending') : rows;

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">{t.requests_title}</h1>
          <p className="text-muted-foreground mt-1">{t.requests_sub}</p>
        </div>
        <div className="flex gap-2">
          <Button variant={filter === 'pending' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('pending')}>{t.requests_pending}</Button>
          <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>{t.requests_all}</Button>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">{t.requests_loading}</p>
      ) : filtered.length === 0 ? (
        <div className="surface p-10 flex flex-col items-center text-center text-muted-foreground">
          <Inbox className="h-8 w-8 mb-3 text-muted-foreground/50" />
          <p>{filter === 'pending' ? t.requests_empty_pending : t.requests_empty_all}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map(r => (
            <li key={r.id} className="surface p-5 flex flex-col md:flex-row md:items-center gap-4 justify-between">
              <div className="flex items-center gap-4 min-w-0">
                <img
                  src={r.athlete?.avatar_url || `https://i.pravatar.cc/150?u=${r.athlete_id}`}
                  alt={`Profile photo of ${r.athlete?.full_name || t.requests_athlete}`}
                  className="h-11 w-11 rounded-full object-cover shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-medium">{r.athlete?.full_name || t.requests_athlete}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {r.slot ? `${new Date(r.slot.date + 'T00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · ${r.slot.start_time.slice(0,5)}–${r.slot.end_time.slice(0,5)}` : t.requests_slot_deleted}
                    {r.price ? ` · €${r.price}` : ''}
                  </p>
                  {r.note && <p className="text-sm mt-2 italic text-muted-foreground">"{r.note}"</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {r.status === 'pending' ? (
                  <>
                    <Button size="sm" onClick={() => decide(r.id, 'confirmed')}><Check className="h-4 w-4 mr-1" /> {t.requests_approve}</Button>
                    <Button size="sm" variant="outline" onClick={() => decide(r.id, 'declined')}><X className="h-4 w-4 mr-1" /> {t.requests_decline}</Button>
                  </>
                ) : (
                  <span className={`text-xs uppercase tracking-wider px-2 py-1 border ${
                    r.status === 'confirmed' ? 'border-gold text-gold' :
                    'border-muted-foreground/30 text-muted-foreground'
                  }`}>{t[`requests_st_${r.status}` as const]}</span>
                )}
                <Button size="sm" variant="ghost" onClick={() => message(r.athlete_id)}>
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BookingRequests;
