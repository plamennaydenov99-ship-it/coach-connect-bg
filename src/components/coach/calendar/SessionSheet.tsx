import { useStaffPaths } from '@/context/StaffRoleContext';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Repeat, MapPin, Clock, UserRound } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import {
  findOverlaps, isResourceConflict, useCancelFollowing, useCoachTz, useReschedule, useSessionStatus, type CalSession,
} from '@/hooks/coach/useCoachCalendar';
import { toDateStr, toTimeStr, zonedToUtc } from '@/lib/tz';
import { fmtDateTime, portalBtnGhost, portalBtnPrimary, portalInput, portalLabel } from '@/components/coach/clients/shared';
import { GroupRoster } from './GroupRoster';
import { toast } from 'sonner';

type Scope = 'one' | 'following';

export function SessionSheet({ session, onClose }: { session: CalSession | null; onClose: () => void }) {
  const isMobile = useIsMobile();
  return (
    <Sheet open={!!session} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side={isMobile ? 'bottom' : 'right'} className="coach-portal w-full sm:max-w-[420px] bg-portal-card border-portal-border max-h-[92vh] overflow-y-auto">
        {session && <Body key={session.id} s={session} onClose={onClose} />}
      </SheetContent>
    </Sheet>
  );
}

function Body({ s, onClose }: { s: CalSession; onClose: () => void }) {
  const { t, lang } = useLanguage();
  const { base, peoplePath } = useStaffPaths();
  const tz = useCoachTz();
  const { user } = useAuth();
  const setStatus = useSessionStatus();
  const cancelFollowing = useCancelFollowing();
  const reschedule = useReschedule();
  const durationMin = Math.round((new Date(s.ends_at).getTime() - new Date(s.starts_at).getTime()) / 60000);

  const [mode, setMode] = useState<'view' | 'reschedule' | 'cancel-scope'>('view');
  const [date, setDate] = useState(toDateStr(s.starts_at, tz));
  const [time, setTime] = useState(toTimeStr(s.starts_at, tz));
  const [duration, setDuration] = useState(durationMin);
  const [location, setLocation] = useState(s.location ?? '');
  const [scope, setScope] = useState<Scope>('one');
  const [overlap, setOverlap] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  useEffect(() => { setConfirmed(false); setOverlap(0); }, [date, time, duration]);

  const err = (e?: unknown) => toast.error(isResourceConflict(e) ? t.cal_resource_conflict : t.crm_error);
  const status = (st: 'attended' | 'no_show' | 'cancelled') =>
    setStatus.mutate({ id: s.id, status: st }, { onSuccess: () => { toast.success(t.cal_updated); onClose(); }, onError: err });

  const onCancel = () => (s.series_id ? setMode('cancel-scope') : status('cancelled'));
  const doCancelScope = (sc: Scope) =>
    sc === 'one'
      ? status('cancelled')
      : cancelFollowing.mutate(s, { onSuccess: () => { toast.success(t.cal_updated); onClose(); }, onError: err });

  const saveReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (duration < 5 || duration > 600) return;
    try {
      if (!confirmed) {
        const st = zonedToUtc(date, time, tz);
        const n = await findOverlaps(user.id, [{ starts_at: st.toISOString(), ends_at: new Date(st.getTime() + duration * 60000).toISOString() }], [s.id]);
        if (n > 0) { setOverlap(n); setConfirmed(true); return; }
      }
      await reschedule.mutateAsync({ session: s, date, time, duration, location: location.trim().slice(0, 200), scope });
      toast.success(t.cal_updated);
      onClose();
    } catch (e) { err(e); }
  };

  const ScopePicker = ({ value, onChange }: { value: Scope; onChange: (v: Scope) => void }) => (
    <div className="space-y-1.5">
      <span className={portalLabel}>{t.cal_scope_title}</span>
      <div className="flex gap-1.5">
        {(['one', 'following'] as const).map((k) => (
          <button type="button" key={k} onClick={() => onChange(k)}
            className={`flex-1 h-9 rounded-[4px] border text-sm ${value === k ? 'bg-portal-selected border-portal-selected-border' : 'border-portal-border text-portal-muted-strong'}`}>
            {k === 'one' ? t.cal_scope_one : t.cal_scope_following}
          </button>
        ))}
      </div>
    </div>
  );


  return (
    <div className="space-y-5 pt-2">
      <div>
        <SheetTitle className="font-display text-xl uppercase tracking-[0.08em] text-portal-ink">{s.capacity != null ? s.title || t.group_type : s.client?.display_name ?? '—'}</SheetTitle>
        <SheetDescription className="sr-only">{t.cal_title}</SheetDescription>
        {s.client_id && <Link to={`${peoplePath}/${s.client_id}`} className="text-sm text-portal-blue underline-offset-2 hover:underline">{t.cal_open_client}</Link>}
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-portal-muted" />{fmtDateTime(s.starts_at, lang, tz)} – {toTimeStr(s.ends_at, tz)}</div>
        {s.location && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-portal-muted" />{s.location}</div>}
        {s.series_id && <div className="flex items-center gap-2"><Repeat className="h-4 w-4 text-portal-muted" />{t.cal_repeats}</div>}
        {s.capacity != null && s.led_by && <div className="flex items-center gap-2"><UserRound className="h-4 w-4 text-portal-muted" />{t.group_led_by_line.replace('{name}', s.led_by)}</div>}
        <div className="flex gap-2 pt-1">
          <span className={`text-[11px] px-1.5 py-0.5 rounded-[4px] border ${s.kind === 'trial' ? 'bg-portal-copper-tint border-portal-copper' : 'bg-portal-selected border-portal-selected-border'}`}>
            {s.capacity != null ? t.group_type : s.kind === 'trial' ? t.cal_type_trial : t.cal_type_session}
          </span>
          {s.capacity != null && s.is_public && <span className="text-[11px] px-1.5 py-0.5 rounded-[4px] border border-portal-blue text-portal-blue bg-portal-card">{t.group_trending_badge}</span>}
          <span className="text-[11px] px-1.5 py-0.5 rounded-[4px] border border-portal-border">{t[`crm_status_${s.status}` as 'crm_status_scheduled']}</span>
        </div>
      </div>

      {mode === 'view' && s.capacity != null && <GroupRoster session={s} />}

      {mode === 'view' && s.status !== 'cancelled' && (
        <div className="grid grid-cols-2 gap-2">
          {s.capacity == null && s.status !== 'attended' && <button className={portalBtnGhost} onClick={() => status('attended')}>{t.cal_mark_attended}</button>}
          {s.capacity == null && s.status !== 'no_show' && <button className={portalBtnGhost} onClick={() => status('no_show')}>{t.cal_no_show}</button>}
          <button className={portalBtnGhost} onClick={() => setMode('reschedule')}>{t.cal_reschedule}</button>
          <button className={`${portalBtnGhost} text-portal-coral-text border-portal-copper`} onClick={onCancel}>{t.cal_cancel_session}</button>
        </div>
      )}

      {mode === 'cancel-scope' && (
        <div className="space-y-3">
          <span className={portalLabel}>{t.cal_scope_title}</span>
          <div className="grid gap-2">
            <button className={portalBtnGhost} onClick={() => doCancelScope('one')}>{t.cal_scope_one}</button>
            <button className={portalBtnGhost} onClick={() => doCancelScope('following')}>{t.cal_scope_following}</button>
            <button className="text-sm text-portal-muted" onClick={() => setMode('view')}>{t.crm_cancel}</button>
          </div>
        </div>
      )}

      {mode === 'reschedule' && (
        <form onSubmit={saveReschedule} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1 block"><span className={portalLabel}>{t.cal_date}</span>
              <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={portalInput} /></label>
            <label className="space-y-1 block"><span className={portalLabel}>{t.cal_start}</span>
              <input type="time" required step={300} value={time} onChange={(e) => setTime(e.target.value)} className={portalInput} /></label>
          </div>
          <label className="space-y-1 block"><span className={portalLabel}>{t.cal_duration} ({t.cal_minutes})</span>
            <input type="number" min={5} max={600} step={5} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={portalInput} /></label>
          <label className="space-y-1 block"><span className={portalLabel}>{t.cal_location}</span>
            <input value={location} maxLength={200} onChange={(e) => setLocation(e.target.value)} className={portalInput} /></label>
          {s.series_id && <ScopePicker value={scope} onChange={setScope} />}
          {confirmed && overlap > 0 && (
            <p className="text-sm p-2 rounded-[4px] border border-portal-copper bg-portal-copper-tint">{t.cal_overlap_warning.replace('{n}', String(overlap))}</p>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" className={portalBtnGhost} onClick={() => setMode('view')}>{t.crm_cancel}</button>
            <button type="submit" className={portalBtnPrimary} disabled={reschedule.isPending}>{confirmed && overlap > 0 ? t.cal_save_anyway : t.crm_save}</button>
          </div>
        </form>
      )}
    </div>
  );
}
