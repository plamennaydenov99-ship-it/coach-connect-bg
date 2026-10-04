import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/context/LanguageContext';
import { useStaffRole } from '@/context/StaffRoleContext';
import { useAuth } from '@/hooks/useAuth';
import { useClientList, useCreateClient } from '@/hooks/coach/useCoachClients';
import { bookingCandidates, findOverlaps, findResourceClashes, isResourceConflict, useBookSession, useCoachTz, TOPUP_WEEKS } from '@/hooks/coach/useCoachCalendar';
import { useClubResources } from '@/hooks/coach/useClubResources';
import { addDays, type DateStr } from '@/lib/tz';
import { Avatar, fmtDateTime, portalBtnGhost, portalBtnPrimary, portalInput, portalLabel } from '@/components/coach/clients/shared';
import { toast } from 'sonner';

const DURATIONS = [30, 45, 60, 90];

export function QuickBookForm({ initial, onDone, onClose }: {
  initial: { date: DateStr; time: string; clientId?: string; kind?: 'session' | 'trial' | 'group' | 'hire'; resourceId?: string };
  onDone: () => void;
  onClose: () => void;
}) {
  const { t, lang } = useLanguage();
  const club = useStaffRole() === 'club';
  const { user } = useAuth();
  const tz = useCoachTz();
  const { data: clients = [] } = useClientList();
  const createClient = useCreateClient();
  const book = useBookSession();
  const { data: allResources = [] } = useClubResources();
  const resources = club ? allResources.filter((r) => r.active) : [];

  const [clientId, setClientId] = useState(initial.clientId ?? '');
  const [q, setQ] = useState('');
  const [newName, setNewName] = useState<string | null>(null);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [duration, setDuration] = useState(60);
  const [custom, setCustom] = useState(false);
  const [location, setLocation] = useState('');
  const [kind, setKind] = useState<'session' | 'trial' | 'group' | 'hire'>(initial.kind ?? 'session');
  const [resourceId, setResourceId] = useState(initial.resourceId ?? '');
  const [note, setNote] = useState('');
  const [clashes, setClashes] = useState<{ starts_at: string }[]>([]);
  const [title, setTitle] = useState('');
  const [sport, setSport] = useState('');
  const [ledBy, setLedBy] = useState('');
  const [capacity, setCapacity] = useState(12);
  const [isPublic, setPublic] = useState(false);
  const [attendeeIds, setAttendees] = useState<string[]>(initial.clientId ? [initial.clientId] : []);
  const [repeat, setRepeat] = useState(false);
  const [endsOn, setEndsOn] = useState(addDays(initial.date, TOPUP_WEEKS * 7));
  const [overlaps, setOverlaps] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [skipClashes, setSkipClashes] = useState(false);

  useEffect(() => { setDate(initial.date); setTime(initial.time); if (initial.clientId) setClientId(initial.clientId); }, [initial.date, initial.time, initial.clientId]);
  useEffect(() => { setConfirmed(false); setOverlaps(0); setClashes([]); setSkipClashes(false); }, [date, time, duration, repeat, endsOn, resourceId]);
  useEffect(() => { if (initial.resourceId) setResourceId(initial.resourceId); }, [initial.resourceId]);

  const active = clients.filter((c) => c.stage !== 'archived');
  const selected = active.find((c) => c.id === clientId);
  const matches = useMemo(() => {
    const s = q.trim().toLowerCase();
    return active.filter((c) => !s || c.display_name.toLowerCase().includes(s)).slice(0, 6);
  }, [active, q]);

  const addClient = async () => {
    const name = (newName ?? '').trim().slice(0, 120);
    if (!name) return;
    try {
      const row = await createClient.mutateAsync({ display_name: name, stage: 'enquiry' });
      setClientId(row.id); setNewName(null); setQ('');
    } catch { toast.error(t.crm_error); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (kind === 'hire' && (!title.trim() || !resourceId)) return toast.error(t.hire_required);
    if (kind !== 'group' && kind !== 'hire' && !clientId) return toast.error(t.cal_pick_client);
    if (kind === 'group' && (!Number.isInteger(capacity) || capacity < 1 || attendeeIds.length > capacity)) return toast.error(t.group_capacity_error);
    if (!user) return;
    if (!date || !/^\d{2}:\d{2}$/.test(time) || duration < 5 || duration > 600) return;
    const input = { resource_id: resourceId || null, note: kind === 'hire' ? note : '', skip: [] as string[], client_id: kind === 'group' || kind === 'hire' ? null : clientId, date, time, duration, location: location.trim().slice(0, 200), kind: kind === 'trial' ? 'trial' as const : kind === 'hire' ? 'hire' as const : 'session' as const, repeat, endsOn: repeat ? endsOn || null : null, capacity: kind === 'group' ? capacity : null, title: title.trim(), sport: sport.trim(), led_by: ledBy.trim(), is_public: isPublic, attendee_ids: attendeeIds };
    try {
      if (input.resource_id) {
        const cands = bookingCandidates(input, tz);
        const hits = await findResourceClashes(input.resource_id, cands);
        if (hits.length) {
          if (!(skipClashes && repeat && hits.length < cands.length)) { setClashes(hits); return; }
          input.skip = hits.map((h) => h.starts_at);
        }
      }
      if (!confirmed) {
        const n = await findOverlaps(user.id, bookingCandidates(input, tz).filter((c) => !input.skip.includes(c.starts_at)));
        if (n > 0) { setOverlaps(n); setConfirmed(true); return; }
      }
      await book.mutateAsync(input);
      toast.success(t.cal_booked);
      onDone();
    } catch (err) { toast.error(isResourceConflict(err) ? t.cal_resource_conflict : t.crm_error); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg uppercase tracking-[0.1em]">{t.cal_quick_book}</h2>
        <button type="button" onClick={onClose} aria-label={t.cal_close} className="h-8 w-8 flex items-center justify-center text-portal-muted-strong"><X className="h-4 w-4" /></button>
      </div>

      <div className="space-y-1.5">
        <span className={portalLabel}>{t.cal_type}</span>
        <div className="flex gap-1.5">
          {(club ? ['group', 'session', 'hire'] as const : ['session', 'trial', 'group'] as const).map((k) => (
            <Button variant="ghost" type="button" key={k} onClick={() => setKind(k)}
              className={`flex-1 h-9 rounded-[4px] border text-sm ${kind === k ? (k === 'trial' ? 'bg-portal-copper-tint border-portal-copper' : 'bg-portal-selected border-portal-selected-border') : 'border-portal-border text-portal-muted-strong'}`}>
              {k === 'group' ? t.group_type : k === 'hire' ? t.hire_type : k === 'trial' ? t.cal_type_trial : t.cal_type_one}
            </Button>
          ))}
        </div>
      </div>

      {kind === 'group' ? <div className="space-y-3">
        <label className="block space-y-1"><span className={portalLabel}>{t.group_title}</span><input required value={title} onChange={e => setTitle(e.target.value)} maxLength={120} className={portalInput} /></label>
        <label className="block space-y-1"><span className={portalLabel}>{t.group_sport}</span><input value={sport} onChange={e => setSport(e.target.value)} maxLength={80} className={portalInput} /></label>
        <label className="block space-y-1"><span className={portalLabel}>{t.group_led_by}</span><input value={ledBy} onChange={e => setLedBy(e.target.value)} maxLength={80} className={portalInput} /></label>
        <label className="block space-y-1"><span className={portalLabel}>{t.group_capacity}</span><input type="number" required min={1} step={1} value={capacity} onChange={e => setCapacity(Number(e.target.value))} className={portalInput} /></label>
        <div><label className="flex justify-between items-center text-sm">{t.group_trending}<Switch checked={isPublic} onCheckedChange={setPublic} /></label>
          <p className="text-xs text-portal-muted mt-1">{t.group_trending_hint}</p></div>
        <fieldset className="space-y-2"><legend className={portalLabel}>{t.group_attendees} · {attendeeIds.length}/{capacity}</legend>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={t.cal_search_client} className={portalInput} />
          <div className="max-h-40 overflow-y-auto space-y-2">{active.filter(c => c.display_name.toLowerCase().includes(q.toLowerCase())).map(c => <label key={c.id} className="flex gap-2 items-center text-sm">
            <input type="checkbox" checked={attendeeIds.includes(c.id)} disabled={!attendeeIds.includes(c.id) && attendeeIds.length >= capacity} onChange={e => setAttendees(ids => e.target.checked ? [...ids, c.id] : ids.filter(id => id !== c.id))} className="accent-portal-blue" />{c.display_name}
          </label>)}</div>
        </fieldset>
      </div> : kind === 'hire' ? <div className="space-y-3">
        <label className="block space-y-1"><span className={portalLabel}>{t.hire_label}</span><input required value={title} onChange={e => setTitle(e.target.value)} maxLength={120} placeholder={t.hire_label_ph} className={portalInput} /></label>
        <label className="block space-y-1"><span className={portalLabel}>{t.hire_note}</span><textarea value={note} onChange={e => setNote(e.target.value)} maxLength={500} rows={2} className={portalInput} /></label>
      </div> : (
      <div className="space-y-1.5">
        <span className={portalLabel}>{t.cal_client}</span>
        {selected ? (
          <div className="flex items-center gap-2 p-2 rounded-[4px] border border-portal-selected-border bg-portal-selected">
            <Avatar name={selected.display_name} size={28} />
            <span className="flex-1 text-sm">{selected.display_name}</span>
            <button type="button" onClick={() => setClientId('')} className="text-portal-muted-strong"><X className="h-4 w-4" /></button>
          </div>
        ) : (
          <div className="rounded-[4px] border border-portal-border">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.cal_search_client} className={`${portalInput} border-0 border-b border-portal-border rounded-b-none`} />
            <ul className="max-h-48 overflow-y-auto">
              {matches.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => setClientId(c.id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-portal-bg text-left">
                    <Avatar name={c.display_name} size={24} />{c.display_name}
                  </button>
                </li>
              ))}
              {matches.length === 0 && <li className="px-3 py-2 text-sm text-portal-muted">{t.cal_no_clients}</li>}
            </ul>
            {newName === null ? (
              <button type="button" onClick={() => setNewName(q)} className="w-full flex items-center gap-1.5 px-3 py-2 text-sm text-portal-coral-text border-t border-portal-border">
                <Plus className="h-4 w-4" />{t.cal_new_client_inline}
              </button>
            ) : (
              <div className="flex gap-2 p-2 border-t border-portal-border">
                <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t.cal_new_client_name} className={portalInput} maxLength={120}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addClient(); } }} />
                <button type="button" onClick={addClient} disabled={!newName.trim() || createClient.isPending} className={portalBtnPrimary}><Plus className="h-4 w-4" /></button>
              </div>
            )}
          </div>
        )}
      </div>

      )}

      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1 block"><span className={portalLabel}>{t.cal_date}</span>
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={portalInput} /></label>
        <label className="space-y-1 block"><span className={portalLabel}>{t.cal_start}</span>
          <input type="time" required step={300} value={time} onChange={(e) => setTime(e.target.value)} className={portalInput} /></label>
      </div>

      <div className="space-y-1.5">
        <span className={portalLabel}>{t.cal_duration}</span>
        <div className="flex flex-wrap gap-1.5">
          {DURATIONS.map((d) => (
            <button type="button" key={d} onClick={() => { setDuration(d); setCustom(false); }}
              className={`h-8 px-3 rounded-[4px] border text-sm ${!custom && duration === d ? 'bg-portal-selected border-portal-selected-border' : 'border-portal-border text-portal-muted-strong'}`}>
              {d} {t.cal_minutes}
            </button>
          ))}
          <button type="button" onClick={() => setCustom(true)} className={`h-8 px-3 rounded-[4px] border text-sm ${custom ? 'bg-portal-selected border-portal-selected-border' : 'border-portal-border text-portal-muted-strong'}`}>{t.cal_custom}</button>
        </div>
        {custom && <input type="number" min={5} max={600} step={5} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={`${portalInput} w-28`} />}
      </div>

      {club && (
        <label className="space-y-1 block"><span className={portalLabel}>{t.cal_facility}{kind === 'hire' ? ' *' : ''}</span>
          <select value={resourceId} required={kind === 'hire'} onChange={(e) => setResourceId(e.target.value)} className={portalInput}>
            <option value="">{t.cal_no_facility}</option>
            {resources.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          {resources.length === 0 && <span className="text-xs text-portal-muted">{t.cal_no_facilities_yet}</span>}
        </label>
      )}

      <label className="space-y-1 block"><span className={portalLabel}>{t.cal_location}</span>
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t.cal_location_ph} maxLength={200} className={portalInput} /></label>


      <div className="space-y-2">
        <label className="flex items-center justify-between text-sm"><span>{t.cal_repeat_weekly}</span><Switch checked={repeat} onCheckedChange={setRepeat} /></label>
        {repeat && (
          <label className="space-y-1 block"><span className={portalLabel}>{t.cal_ends_on}</span>
            <input type="date" value={endsOn} min={date} onChange={(e) => setEndsOn(e.target.value)} className={portalInput} />
            <span className="text-xs text-portal-muted">{t.cal_ends_hint}</span>
          </label>
        )}
      </div>

      {clashes.length > 0 && (
        <div role="alert" className="space-y-2 p-3 rounded-[4px] border border-portal-ink bg-portal-bg text-sm">
          <div className="flex gap-2"><AlertTriangle className="h-4 w-4 text-portal-ink shrink-0 mt-0.5" /><span className="font-medium">{t.cal_resource_clash}</span></div>
          <ul className="list-disc pl-6 max-h-28 overflow-y-auto">{clashes.map((c) => <li key={c.starts_at}>{fmtDateTime(c.starts_at, lang, tz)}</li>)}</ul>
          <p className="text-portal-muted-strong">{t.cal_clash_change}</p>
          {repeat && clashes.length < bookingCandidates({ date, time, duration, repeat, endsOn: endsOn || null }, tz).length && (
            <button type="submit" onClick={() => setSkipClashes(true)} className={portalBtnGhost}>{t.cal_skip_clashes}</button>
          )}
        </div>
      )}

      {confirmed && overlaps > 0 && (
        <div className="flex gap-2 p-3 rounded-[4px] border border-portal-copper bg-portal-copper-tint text-sm">
          <AlertTriangle className="h-4 w-4 text-portal-ink shrink-0 mt-0.5" />
          <span>{t.cal_overlap_warning.replace('{n}', String(overlaps))}</span>
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onClose} className={portalBtnGhost}>{t.crm_cancel}</button>
        <button type="submit" disabled={book.isPending || clashes.length > 0} className={portalBtnPrimary}>{confirmed && overlaps > 0 ? t.cal_save_anyway : kind === 'group' ? t.group_submit : kind === 'hire' ? t.hire_submit : t.cal_book}</button>
      </div>
    </form>
  );
}
