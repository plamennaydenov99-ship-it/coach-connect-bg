import { useState } from 'react';
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/context/LanguageContext';
import {
  RESOURCE_KINDS, futureSessionCount, useClubResources, useDeleteResource, useSaveResource, useWeekResourceSessions,
  type ClubResource,
} from '@/hooks/coach/useClubResources';
import { resourceOccupancy } from '@/lib/sessionMetrics';
import { portalBtnGhost, portalBtnPrimary, portalInput, portalLabel } from '@/components/coach/clients/shared';

type Draft = { id?: string; name: string; sport: string; kind: string; capacity: string; open_time: string; close_time: string; active: boolean };
const blank: Draft = { name: '', sport: '', kind: 'court', capacity: '', open_time: '07:00', close_time: '23:00', active: true };

export default function ClubFacilities() {
  const { t } = useLanguage();
  const { data: resources = [], isLoading } = useClubResources();
  const { data: week } = useWeekResourceSessions();
  const save = useSaveResource();
  const del = useDeleteResource();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [inUse, setInUse] = useState<ClubResource | null>(null);

  const kindLabel = (k: string) => (t as Record<string, string>)[`fac_kind_${k}`] ?? k;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    const name = draft.name.trim().slice(0, 60);
    if (!name) return;
    if (draft.close_time <= draft.open_time) return toast.error(t.fac_hours_error);
    const cap = draft.capacity ? Number(draft.capacity) : null;
    if (cap != null && (!Number.isInteger(cap) || cap < 1)) return toast.error(t.crm_error);
    try {
      await save.mutateAsync({ id: draft.id, name, sport: draft.sport.trim().slice(0, 60) || null, kind: draft.kind, capacity: cap, open_time: draft.open_time, close_time: draft.close_time, active: draft.active });
      toast.success(t.fac_saved);
      setDraft(null);
    } catch { toast.error(t.crm_error); }
  };

  const remove = async (r: ClubResource) => {
    try {
      if (await futureSessionCount(r.id)) return setInUse(r);
      await del.mutateAsync(r.id);
      toast.success(t.fac_deleted);
    } catch (e) { if ((e as Error).message === 'in_use') setInUse(r); else toast.error(t.crm_error); }
  };

  const toggle = (r: ClubResource, active: boolean) =>
    save.mutate({ id: r.id, active }, { onSuccess: () => toast.success(t.fac_saved), onError: () => toast.error(t.crm_error) });

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="font-display uppercase tracking-[0.08em] text-3xl text-portal-ink">{t.portal_facilities}</h1>
        <div className="flex-1" />
        {resources.length > 0 && <button className={portalBtnPrimary} onClick={() => setDraft(blank)}><Plus className="h-4 w-4" />{t.fac_add}</button>}
      </div>

      {isLoading ? <Skeleton className="h-40 w-full" /> : resources.length === 0 ? (
        <div className="bg-portal-card border border-portal-border rounded-[4px] p-8 text-center space-y-3">
          <Building2 className="h-6 w-6 text-portal-blue mx-auto" />
          <p className="font-display uppercase tracking-[0.08em] text-xl">{t.fac_empty}</p>
          <p className="text-sm text-portal-muted-strong">{t.fac_empty_body}</p>
          <button className={portalBtnPrimary} onClick={() => setDraft(blank)}><Plus className="h-4 w-4" />{t.fac_add}</button>
        </div>
      ) : (
        <ul className="space-y-3">
          {resources.map((r) => {
            const occ = week ? resourceOccupancy(r, week.sessions.filter((s) => s.resource_id === r.id), week.start, week.end) : null;
            return (
              <li key={r.id} className={`bg-portal-card border border-portal-border rounded-[4px] p-4 space-y-3 ${r.active ? '' : 'opacity-70'}`}>
                <div className="flex flex-wrap items-start gap-3">
                  <div className="flex-1 min-w-[180px]">
                    <p className="font-display uppercase tracking-[0.06em] text-lg">{r.name}</p>
                    <p className="text-sm text-portal-muted-strong">
                      {[kindLabel(r.kind), r.sport, r.capacity ? `${t.fac_capacity}: ${r.capacity}` : null, `${r.open_time.slice(0, 5)}–${r.close_time.slice(0, 5)}`].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-sm">{t.fac_active}<Switch checked={r.active} onCheckedChange={(v) => toggle(r, v)} /></label>
                  <button aria-label={t.fac_edit} className={`${portalBtnGhost} px-2`} onClick={() => setDraft({ id: r.id, name: r.name, sport: r.sport ?? '', kind: r.kind, capacity: r.capacity ? String(r.capacity) : '', open_time: r.open_time.slice(0, 5), close_time: r.close_time.slice(0, 5), active: r.active })}><Pencil className="h-4 w-4" /></button>
                  <button aria-label={t.fac_delete} className={`${portalBtnGhost} px-2`} onClick={() => remove(r)}><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm"><span className={portalLabel}>{t.fac_occupancy}</span><span className="font-medium">{occ ? `${occ.percentage}%` : '—'}</span></div>
                  <div className="h-2 rounded-[4px] bg-portal-bg overflow-hidden" role="progressbar" aria-valuenow={occ?.percentage ?? 0} aria-valuemin={0} aria-valuemax={100} aria-label={t.fac_occupancy}>
                    <div className="h-full bg-portal-blue" style={{ width: `${occ?.percentage ?? 0}%` }} />
                  </div>
                  <p className="text-xs text-portal-muted">{t.fac_occupancy_caption}{occ ? ` · ${+occ.bookedHours.toFixed(1)} / ${+occ.openHours.toFixed(1)} h` : ''}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="coach-portal bg-portal-card border-portal-border rounded-[4px] max-w-md">
          <DialogTitle className="font-display uppercase tracking-[0.1em]">{draft?.id ? t.fac_edit : t.fac_add}</DialogTitle>
          {draft && <form onSubmit={submit} className="space-y-3">
            <label className="block space-y-1"><span className={portalLabel}>{t.fac_name}</span>
              <input required maxLength={60} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={portalInput} /></label>
            <label className="block space-y-1"><span className={portalLabel}>{t.fac_kind}</span>
              <select value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value })} className={portalInput}>
                {RESOURCE_KINDS.map((k) => <option key={k} value={k}>{kindLabel(k)}</option>)}
              </select></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1"><span className={portalLabel}>{t.group_sport}</span>
                <input maxLength={60} value={draft.sport} onChange={(e) => setDraft({ ...draft, sport: e.target.value })} className={portalInput} /></label>
              <label className="block space-y-1"><span className={portalLabel}>{t.fac_capacity}</span>
                <input type="number" min={1} step={1} value={draft.capacity} onChange={(e) => setDraft({ ...draft, capacity: e.target.value })} className={portalInput} /></label>
              <label className="block space-y-1"><span className={portalLabel}>{t.fac_open}</span>
                <input type="time" required value={draft.open_time} onChange={(e) => setDraft({ ...draft, open_time: e.target.value })} className={portalInput} /></label>
              <label className="block space-y-1"><span className={portalLabel}>{t.fac_close}</span>
                <input type="time" required value={draft.close_time} onChange={(e) => setDraft({ ...draft, close_time: e.target.value })} className={portalInput} /></label>
            </div>
            <label className="flex items-center justify-between text-sm">{t.fac_active}<Switch checked={draft.active} onCheckedChange={(v) => setDraft({ ...draft, active: v })} /></label>
            <div className="flex justify-end gap-2">
              <button type="button" className={portalBtnGhost} onClick={() => setDraft(null)}>{t.crm_cancel}</button>
              <button type="submit" disabled={save.isPending} className={portalBtnPrimary}>{t.fac_save}</button>
            </div>
          </form>}
        </DialogContent>
      </Dialog>

      <Dialog open={!!inUse} onOpenChange={(o) => !o && setInUse(null)}>
        <DialogContent className="coach-portal bg-portal-card border-portal-border rounded-[4px] max-w-sm">
          <DialogTitle className="font-display uppercase tracking-[0.1em]">{t.fac_delete}</DialogTitle>
          <p className="text-sm text-portal-muted-strong">{t.fac_in_use}</p>
          <div className="flex justify-end gap-2">
            <button className={portalBtnGhost} onClick={() => setInUse(null)}>{t.crm_cancel}</button>
            {inUse?.active && <button className={portalBtnPrimary} onClick={() => { toggle(inUse, false); setInUse(null); }}>{t.fac_deactivate}</button>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
