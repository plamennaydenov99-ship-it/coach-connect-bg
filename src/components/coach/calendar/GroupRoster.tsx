import { useState } from 'react';
import { Check, UserX, X, Plus, MessageSquare } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/context/LanguageContext';
import { useClientList } from '@/hooks/coach/useCoachClients';
import { useGroupActions, useGroupRoster } from '@/hooks/coach/useGroupSessions';
import type { CalSession } from '@/hooks/coach/useCoachCalendar';
import { portalInput, portalLabel } from '@/components/coach/clients/shared';

export function GroupRoster({ session }: { session: CalSession }) {
  const { t } = useLanguage();
  const { data: roster = [], isLoading } = useGroupRoster(session.id);
  const { data: clients = [] } = useClientList();
  const actions = useGroupActions(session.id);
  const [capacity, setCapacity] = useState(session.capacity ?? 1);
  const [isPublic, setPublic] = useState(session.is_public);
  const [savedCap, setSavedCap] = useState(session.capacity ?? 1);
  const [title, setTitle] = useState(session.title ?? '');
  const [ledBy, setLedBy] = useState(session.led_by ?? '');
  const [clientId, setClientId] = useState('');
  const active = roster.filter(a => a.status !== 'cancelled');
  const fill = active.filter(a => a.status === 'booked' || a.status === 'attended').length;
  return <section className="space-y-3 border-t border-portal-border pt-4">
    <div className="flex items-center justify-between gap-2">
      <h3 className={portalLabel}>{t.group_attendees} · {fill}/{savedCap}</h3>
      <Tooltip><TooltipTrigger asChild><span tabIndex={0}><Button variant="outline" size="sm" disabled className="gap-1.5"><MessageSquare className="h-4 w-4" />{t.group_message_all}</Button></span></TooltipTrigger><TooltipContent>{t.group_coming_soon}</TooltipContent></Tooltip>
    </div>
    {isLoading ? <p className="text-sm text-portal-muted">{t.group_loading}</p> : <ul className="space-y-2">
      {active.map(a => <li key={a.id} className="flex flex-wrap items-center gap-2 text-sm">
        <span className="flex-1 min-w-0">{a.client?.display_name ?? '—'}<span className="block text-xs text-portal-muted">{t[`group_status_${a.status}` as 'group_status_booked']}</span></span>
        <Button variant="ghost" size="icon" title={t.cal_mark_attended} aria-label={`${t.cal_mark_attended}: ${a.client?.display_name}`} disabled={actions.isPending || session.status === 'cancelled'} onClick={() => actions.mutate({ type: 'status', id: a.id, status: 'attended' })}><Check className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" title={t.cal_no_show} aria-label={`${t.cal_no_show}: ${a.client?.display_name}`} disabled={actions.isPending || session.status === 'cancelled'} onClick={() => actions.mutate({ type: 'status', id: a.id, status: 'no_show' })}><UserX className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" title={t.group_remove} aria-label={`${t.group_remove}: ${a.client?.display_name}`} disabled={actions.isPending} onClick={() => actions.mutate({ type: 'status', id: a.id, status: 'cancelled' })}><X className="h-4 w-4" /></Button>
      </li>)}
    </ul>}
    <div className="flex gap-2">
      <select aria-label={t.group_add_attendee} value={clientId} onChange={e => setClientId(e.target.value)} className={portalInput}>
        <option value="">{t.group_add_attendee}</option>
        {clients.filter(c => c.stage !== 'archived' && !active.some(a => a.client_id === c.id)).map(c => <option key={c.id} value={c.id}>{c.display_name}</option>)}
      </select>
      <Button variant="outline" size="icon" aria-label={t.group_add_attendee} disabled={!clientId || fill >= capacity || actions.isPending || session.status === 'cancelled'} onClick={() => actions.mutate({ type: 'add', client_id: clientId }, { onSuccess: () => setClientId('') })}><Plus className="h-4 w-4" /></Button>
    </div>
    <form className="space-y-3" onSubmit={e => { e.preventDefault(); if (!Number.isInteger(capacity) || capacity < Math.max(1, fill)) { toast.error(t.group_capacity_below.replace('{n}', String(fill))); return; } actions.mutate({ type: 'settings', capacity, is_public: isPublic, title, led_by: ledBy }, { onSuccess: () => setSavedCap(capacity) }); }}>
      <label className="block space-y-1"><span className={portalLabel}>{t.group_title}</span><input value={title} onChange={e => setTitle(e.target.value)} maxLength={120} className={portalInput} /></label>
      <label className="block space-y-1"><span className={portalLabel}>{t.group_led_by}</span><input value={ledBy} onChange={e => setLedBy(e.target.value)} maxLength={80} className={portalInput} /></label>
      <label className="block space-y-1"><span className={portalLabel}>{t.group_capacity}</span><input type="number" required min={1} step={1} value={capacity} onChange={e => setCapacity(Number(e.target.value))} className={portalInput} /></label>
      <div><label className="flex justify-between items-center text-sm">{t.group_trending}<Switch checked={isPublic} onCheckedChange={setPublic} /></label>
        <p className="text-xs text-portal-muted mt-1">{t.group_trending_hint}</p></div>
      <Button type="submit" variant="portal" disabled={actions.isPending}>{t.crm_save}</Button>
    </form>
  </section>;
}