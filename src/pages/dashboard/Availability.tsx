import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Plus, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Slot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'open' | 'pending' | 'booked';
}

const Availability = () => {
  const { user, profile } = useAuth();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ date: '', start_time: '', end_time: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('availability_slots')
      .select('id, date, start_time, end_time, status')
      .eq('coach_id', user.id)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });
    setSlots((data as Slot[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  if (profile && profile.role !== 'coach') {
    return <p className="text-muted-foreground">Availability is only available for coach accounts.</p>;
  }

  const addSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.date || !form.start_time || !form.end_time) {
      toast.error('Fill in all fields.');
      return;
    }
    if (form.end_time <= form.start_time) {
      toast.error('End time must be after start time.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('availability_slots').insert({
      coach_id: user.id,
      date: form.date,
      start_time: form.start_time,
      end_time: form.end_time,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Slot added.');
    setForm({ date: '', start_time: '', end_time: '' });
    load();
  };

  const removeSlot = async (id: string) => {
    const { error } = await supabase.from('availability_slots').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Slot removed.');
    load();
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-3xl">Availability</h1>
        <p className="text-muted-foreground mt-1">Open individual time slots that athletes can request to book.</p>
      </div>

      <form onSubmit={addSlot} className="surface p-6 grid gap-4 sm:grid-cols-4 items-end">
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="start">Start</Label>
          <Input id="start" type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="end">End</Label>
          <Input id="end" type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
        </div>
        <div className="sm:col-span-4">
          <Button type="submit" disabled={saving}>
            <Plus className="h-4 w-4 mr-2" /> {saving ? 'Adding…' : 'Add slot'}
          </Button>
        </div>
      </form>

      <div className="surface overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gold" />
          <h2 className="font-display text-lg">Your slots</h2>
        </div>
        {loading ? (
          <p className="p-6 text-muted-foreground">Loading…</p>
        ) : slots.length === 0 ? (
          <p className="p-6 text-muted-foreground">No slots yet. Add one above.</p>
        ) : (
          <ul className="divide-y divide-border">
            {slots.map(s => (
              <li key={s.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium">{new Date(s.date + 'T00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> {s.start_time.slice(0,5)} – {s.end_time.slice(0,5)}
                    </p>
                  </div>
                  <span className={`text-xs uppercase tracking-wider px-2 py-1 border ${
                    s.status === 'open' ? 'border-gold text-gold' :
                    s.status === 'pending' ? 'border-yellow-500/60 text-yellow-500' :
                    'border-muted-foreground/30 text-muted-foreground'
                  }`}>{s.status}</span>
                </div>
                {s.status === 'open' && (
                  <Button variant="ghost" size="icon" onClick={() => removeSlot(s.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Availability;
