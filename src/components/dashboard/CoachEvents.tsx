import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { CalendarPlus, MapPin, Calendar, Trash2 } from 'lucide-react';

interface CoachEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
}

export function CoachEvents() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [events, setEvents] = useState<CoachEvent[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', event_date: '', location: '' });

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('coach_events')
      .select('id, title, description, event_date, location')
      .eq('coach_id', user.id)
      .order('event_date', { ascending: true });
    setEvents((data as any) ?? []);
  };

  useEffect(() => { load(); }, [user]);

  const create = async () => {
    if (!user || !form.title.trim() || !form.event_date) return;
    const { error } = await supabase.from('coach_events').insert({
      coach_id: user.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      event_date: form.event_date,
      location: form.location.trim() || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(t.coachevents_created);
    setForm({ title: '', description: '', event_date: '', location: '' });
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('coach_events').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  return (
    <div className="surface p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl">{t.coachevents_title}</h2>
        <Button size="sm" onClick={() => setOpen(o => !o)}>
          <CalendarPlus className="h-4 w-4 mr-2" /> {t.coachevents_create}
        </Button>
      </div>

      {open && (
        <div className="space-y-3 border border-border rounded-lg p-4">
          <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder={t.coachevents_title_ph} />
          <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder={t.coachevents_desc_ph} rows={2} />
          <div className="flex flex-col sm:flex-row gap-2">
            <Input type="date" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} className="sm:w-48" />
            <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder={t.coachevents_location_ph} />
          </div>
          <Button onClick={create} disabled={!form.title.trim() || !form.event_date}>{t.coachevents_save}</Button>
        </div>
      )}

      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.coachevents_empty}</p>
      ) : (
        <div className="border border-border rounded-lg divide-y divide-border">
          {events.map(ev => (
            <div key={ev.id} className="p-3 flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-sm">{ev.title}</p>
                <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-3 mt-1">
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(ev.event_date).toLocaleDateString()}</span>
                  {ev.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{ev.location}</span>}
                </p>
                {ev.description && <p className="text-xs text-muted-foreground mt-1">{ev.description}</p>}
              </div>
              <Button size="icon" variant="ghost" onClick={() => remove(ev.id)} aria-label={t.coachevents_delete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
