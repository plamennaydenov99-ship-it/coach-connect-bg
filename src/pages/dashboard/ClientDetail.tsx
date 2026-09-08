import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ProgramSection } from '@/components/dashboard/ProgramSection';
import { ArrowLeft } from 'lucide-react';

interface Booking {
  id: string;
  status: string;
  price: number | null;
  created_at: string;
  slot: { date: string; start_time: string; end_time: string } | null;
}
interface Note { id: string; content: string; created_at: string }
interface Goal { id: string; goal: string; target_date: string | null; status: string; created_at: string }

const ClientDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [athlete, setAthlete] = useState<{ full_name: string | null; avatar_url: string | null; city: string | null } | null>(null);
  const [athleteId, setAthleteId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [noteDraft, setNoteDraft] = useState('');
  const [goalDraft, setGoalDraft] = useState('');
  const [goalDate, setGoalDate] = useState('');
  const [loading, setLoading] = useState(true);

  const loadNotes = async () => {
    const { data } = await supabase.from('client_notes').select('*').eq('relationship_id', id!).order('created_at', { ascending: false });
    setNotes((data as any) ?? []);
  };
  const loadGoals = async () => {
    const { data } = await supabase.from('client_goals').select('*').eq('relationship_id', id!).order('created_at', { ascending: false });
    setGoals((data as any) ?? []);
  };

  useEffect(() => {
    const load = async () => {
      if (!user || !id) return;
      setLoading(true);
      const { data: rel } = await supabase
        .from('coach_clients')
        .select('id, athlete_id, athlete:profiles!coach_clients_athlete_id_fkey(full_name, avatar_url, city)')
        .eq('id', id)
        .maybeSingle();
      if (rel) {
        setAthlete((rel as any).athlete);
        setAthleteId((rel as any).athlete_id);
        const { data: bk } = await supabase
          .from('bookings')
          .select('id, status, price, created_at, slot:availability_slots!bookings_slot_id_fkey(date, start_time, end_time)')
          .eq('coach_id', user.id)
          .eq('athlete_id', (rel as any).athlete_id)
          .order('created_at', { ascending: false });
        setBookings((bk as any) ?? []);
      }
      await Promise.all([loadNotes(), loadGoals()]);
      setLoading(false);
    };
    load();
  }, [user, id]);

  const addNote = async () => {
    if (!noteDraft.trim()) return;
    const { error } = await supabase.from('client_notes').insert({ relationship_id: id!, content: noteDraft.trim() });
    if (error) { toast.error(error.message); return; }
    setNoteDraft('');
    loadNotes();
  };

  const addGoal = async () => {
    if (!goalDraft.trim()) return;
    const { error } = await supabase.from('client_goals').insert({
      relationship_id: id!,
      goal: goalDraft.trim(),
      target_date: goalDate || null,
    });
    if (error) { toast.error(error.message); return; }
    setGoalDraft(''); setGoalDate('');
    loadGoals();
  };

  const setGoalStatus = async (goalId: string, status: string) => {
    const { error } = await supabase.from('client_goals').update({ status }).eq('id', goalId);
    if (error) { toast.error(error.message); return; }
    loadGoals();
  };

  const statusLabel: Record<string, string> = {
    active: t.clientdetail_status_active,
    completed: t.clientdetail_status_completed,
    abandoned: t.clientdetail_status_abandoned,
  };

  if (loading) return <p className="text-muted-foreground text-sm">{t.clients_loading}</p>;
  if (!athleteId) return <p className="text-muted-foreground text-sm">{t.clientdetail_not_found}</p>;

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <Link to="/dashboard/clients" className="text-sm text-muted-foreground inline-flex items-center gap-1 mb-3">
          <ArrowLeft className="h-3.5 w-3.5" /> {t.clientdetail_back}
        </Link>
        <div className="flex items-center gap-4">
          {athlete?.avatar_url ? (
            <img src={athlete.avatar_url} alt={athlete.full_name ?? t.clients_unnamed} className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-lg">
              {(athlete?.full_name ?? '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="font-display text-3xl">{athlete?.full_name ?? t.clients_unnamed}</h1>
            {athlete?.city && <p className="text-sm text-muted-foreground">{athlete.city}</p>}
          </div>
        </div>
      </div>

      {/* Booking history */}
      <section className="space-y-3">
        <h2 className="font-display text-xl">{t.clientdetail_history}</h2>
        {bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.clientdetail_history_empty}</p>
        ) : (
          <div className="border border-border rounded-lg divide-y divide-border">
            {bookings.map((b) => (
              <div key={b.id} className="p-3 flex items-center justify-between gap-4 text-sm">
                <span>
                  {b.slot ? `${new Date(b.slot.date).toLocaleDateString()} · ${b.slot.start_time.slice(0, 5)}–${b.slot.end_time.slice(0, 5)}` : new Date(b.created_at).toLocaleDateString()}
                </span>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">{b.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Notes */}
      <section className="space-y-3">
        <h2 className="font-display text-xl">{t.clientdetail_notes}</h2>
        <Textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder={t.clientdetail_note_placeholder} rows={3} />
        <Button onClick={addNote} disabled={!noteDraft.trim()}>{t.clientdetail_add_note}</Button>
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.clientdetail_notes_empty}</p>
        ) : (
          <div className="space-y-2">
            {notes.map((n) => (
              <div key={n.id} className="border border-border rounded-lg p-3">
                <p className="text-sm whitespace-pre-wrap">{n.content}</p>
                <p className="text-xs text-muted-foreground mt-2">{new Date(n.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Goals */}
      <section className="space-y-3">
        <h2 className="font-display text-xl">{t.clientdetail_goals}</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input value={goalDraft} onChange={(e) => setGoalDraft(e.target.value)} placeholder={t.clientdetail_goal_placeholder} />
          <Input type="date" value={goalDate} onChange={(e) => setGoalDate(e.target.value)} className="sm:w-48" />
          <Button onClick={addGoal} disabled={!goalDraft.trim()}>{t.clientdetail_add_goal}</Button>
        </div>
        {goals.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.clientdetail_goals_empty}</p>
        ) : (
          <div className="border border-border rounded-lg divide-y divide-border">
            {goals.map((g) => (
              <div key={g.id} className="p-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm">{g.goal}</p>
                  {g.target_date && (
                    <p className="text-xs text-muted-foreground">{t.clientdetail_target} {new Date(g.target_date).toLocaleDateString()}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wide border border-border rounded-full px-2 py-0.5">
                    {statusLabel[g.status] ?? g.status}
                  </span>
                  {g.status !== 'completed' && (
                    <Button size="sm" variant="outline" onClick={() => setGoalStatus(g.id, 'completed')}>{t.clientdetail_mark_completed}</Button>
                  )}
                  {g.status !== 'abandoned' && (
                    <Button size="sm" variant="ghost" onClick={() => setGoalStatus(g.id, 'abandoned')}>{t.clientdetail_mark_abandoned}</Button>
                  )}
                  {g.status !== 'active' && (
                    <Button size="sm" variant="ghost" onClick={() => setGoalStatus(g.id, 'active')}>{t.clientdetail_mark_active}</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Training programs for this relationship */}
      <ProgramSection relationshipId={id!} athleteId={athleteId} />
    </div>
  );
};

export default ClientDetail;
