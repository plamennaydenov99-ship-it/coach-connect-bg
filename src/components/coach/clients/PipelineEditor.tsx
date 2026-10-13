import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2 } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/context/LanguageContext';
import {
  pipelineLabel, useDeleteStage, useSaveStages,
  type ClientSummary, type PipelineWithStages, type StageDraft,
} from '@/hooks/coach/useCoachClients';
import { portalBtnGhost, portalBtnPrimary, portalInput, portalLabel } from './shared';

const TYPES = ['enquiry', 'trial', 'active', 'on_hold'] as const;
type Row = StageDraft & { key: string; system_key: string | null };

export function PipelineEditor({ pipeline, clients, open, onOpenChange }: {
  pipeline: PipelineWithStages; clients: ClientSummary[]; open: boolean; onOpenChange: (o: boolean) => void;
}) {
  const { t } = useLanguage();
  const tr = t as unknown as Record<string, string>;
  const isMobile = useIsMobile();
  const save = useSaveStages(pipeline.id);
  const del = useDeleteStage();
  const [rows, setRows] = useState<Row[]>([]);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<{ key: string; target: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    setRows(pipeline.stages.filter((s) => s.category !== 'archived').sort((a, b) => a.position - b.position)
      .map((s) => ({ key: s.id, id: s.id, name: s.name, category: s.category, position: s.position, system_key: s.system_key })));
    setDeleting(null);
  }, [open, pipeline]);

  const count = (id?: string) => (id ? clients.filter((c) => c.stage_id === id).length : 0);
  const typeCount = (cat: string) => rows.filter((r) => r.category === cat).length;
  const locked = (r: Row) => (r.category === 'enquiry' || r.category === 'active') && typeCount(r.category) <= 1;
  const placeholder = (r: Row) => (r.system_key ? tr[`crm_stage_${r.system_key}`] ?? '' : t.crm_stage_name);
  const valid = rows.every((r) => r.id || (r.name ?? '').trim()) && typeCount('enquiry') > 0 && typeCount('active') > 0;

  const patch = (key: string, p: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...p } : r)));
  const move = (from: number, to: number) => setRows((rs) => {
    if (to < 0 || to >= rs.length) return rs;
    const next = [...rs]; const [x] = next.splice(from, 1); next.splice(to, 0, x); return next;
  });

  const submit = () => {
    if (!valid) return;
    const drafts: StageDraft[] = rows.map((r, i) => ({
      id: r.id, name: (r.name ?? '').trim() || (r.id ? null : (r.name ?? '').trim()), category: r.category, position: i,
    }));
    save.mutate(drafts, { onSuccess: () => onOpenChange(false) });
  };

  const confirmDelete = (r: Row) => {
    if (!r.id) { setRows((rs) => rs.filter((x) => x.key !== r.key)); return; }
    const n = count(r.id);
    if (n > 0 && !deleting) {
      const first = rows.find((x) => x.id && x.key !== r.key);
      setDeleting({ key: r.key, target: first?.id ?? '' });
      return;
    }
    del.mutate({ stageId: r.id, moveToStageId: n > 0 ? deleting?.target : undefined }, {
      onSuccess: () => { setRows((rs) => rs.filter((x) => x.key !== r.key)); setDeleting(null); },
    });
  };

  const others = useMemo(() => rows.filter((r) => r.id && r.key !== deleting?.key), [rows, deleting]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isMobile ? 'bottom' : 'right'}
        className={`coach-portal p-0 bg-portal-card border-portal-border flex flex-col gap-0 ${isMobile ? 'max-h-[90vh] rounded-t-[4px]' : 'w-full sm:max-w-[480px]'}`}>
        <div className="p-5 border-b border-portal-border">
          <SheetTitle className="font-display text-xl uppercase tracking-[0.08em] text-portal-ink">{t.crm_edit_stages}</SheetTitle>
          <SheetDescription className="text-sm text-portal-muted">{pipelineLabel(pipeline, t)}</SheetDescription>
        </div>
        <TooltipProvider>
          <div className="flex-1 overflow-y-auto p-5 space-y-2">
            {rows.map((r, i) => (
              <div key={r.key}
                draggable={!isMobile}
                onDragStart={() => setDragKey(r.key)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => { if (dragKey) move(rows.findIndex((x) => x.key === dragKey), i); setDragKey(null); }}
                className={`border border-portal-border rounded-[4px] p-3 space-y-2 bg-portal-card ${dragKey === r.key ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-2">
                  {isMobile ? (
                    <div className="flex flex-col">
                      <button type="button" aria-label="up" onClick={() => move(i, i - 1)} disabled={i === 0} className="text-portal-muted disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                      <button type="button" aria-label="down" onClick={() => move(i, i + 1)} disabled={i === rows.length - 1} className="text-portal-muted disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                    </div>
                  ) : <GripVertical className="h-4 w-4 text-portal-muted cursor-grab shrink-0" />}
                  <input aria-label={t.crm_stage_name} value={r.name ?? ''} maxLength={60} placeholder={placeholder(r)}
                    onChange={(e) => patch(r.key, { name: e.target.value })} className={`${portalInput} flex-1`} />
                  <span className="text-xs text-portal-muted w-6 text-right tabular-nums">{count(r.id)}</span>
                  {locked(r) ? (
                    <Tooltip>
                      <TooltipTrigger asChild><span><button type="button" disabled className="p-1.5 text-portal-muted opacity-40"><Trash2 className="h-4 w-4" /></button></span></TooltipTrigger>
                      <TooltipContent>{t.crm_last_stage_lock}</TooltipContent>
                    </Tooltip>
                  ) : (
                    <button type="button" aria-label="delete" onClick={() => confirmDelete(r)} disabled={del.isPending} className="p-1.5 text-portal-muted hover:text-portal-ink"><Trash2 className="h-4 w-4" /></button>
                  )}
                </div>
                <label className="flex items-center gap-2">
                  <span className={portalLabel}>{t.crm_stage_type}</span>
                  <select value={r.category} disabled={r.id ? locked(r) : false}
                    onChange={(e) => patch(r.key, { category: e.target.value })} className={`${portalInput} h-8 py-0 flex-1`}>
                    {TYPES.map((c) => <option key={c} value={c}>{tr[`crm_type_${c}`]}</option>)}
                  </select>
                </label>
                {deleting?.key === r.key && (
                  <div className="border-t border-portal-border pt-2 space-y-2">
                    <span className={portalLabel}>{t.crm_move_clients_to}</span>
                    <select value={deleting.target} onChange={(e) => setDeleting({ ...deleting, target: e.target.value })} className={portalInput}>
                      {others.map((o) => <option key={o.key} value={o.id}>{(o.name ?? '').trim() || placeholder(o)}</option>)}
                    </select>
                    <div className="flex justify-end gap-2">
                      <button type="button" className={portalBtnGhost} onClick={() => setDeleting(null)}>{t.crm_cancel}</button>
                      <button type="button" className={portalBtnPrimary} disabled={!deleting.target || del.isPending} onClick={() => confirmDelete(r)}>{t.crm_delete ?? 'OK'}</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setRows((rs) => [...rs, { key: crypto.randomUUID(), name: '', category: 'enquiry', position: rs.length, system_key: null }])}
              className="h-9 px-3 text-sm inline-flex items-center gap-1 text-portal-muted-strong hover:text-portal-ink">
              <Plus className="h-4 w-4" />{t.crm_add_stage}
            </button>
          </div>
        </TooltipProvider>
        <div className="p-4 border-t border-portal-border flex justify-end gap-2">
          <button type="button" className={portalBtnGhost} onClick={() => onOpenChange(false)}>{t.crm_cancel}</button>
          <button type="button" className={portalBtnPrimary} disabled={!valid || save.isPending} onClick={submit}>{t.crm_save ?? t.crm_stages_saved}</button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
