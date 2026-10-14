import { useState } from 'react';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLanguage } from '@/context/LanguageContext';
import { useEffect } from 'react';
import { ALL_STAGES, pipelineLabel, stageLabel, useCreateClient, usePipelines, useUpdateClient } from '@/hooks/coach/useCoachClients';
import { portalBtnGhost, portalBtnPrimary, portalInput, portalLabel } from './shared';
import { toast } from 'sonner';

export const BILL_TYPES = ['none', 'per_session', 'weekly', 'monthly'] as const;

const schema = z.object({
  display_name: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(40),
  email: z.union([z.literal(''), z.string().trim().email().max(255)]),
  goal: z.string().trim().max(300),
  source: z.string().trim().max(120),
});

export function NewClientDialog({ open, onOpenChange, onCreated, pipelineId }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated?: (id: string) => void; pipelineId?: string | null }) {
  const { t } = useLanguage();
  const create = useCreateClient();
  const update = useUpdateClient();
  const empty = { display_name: '', phone: '', email: '', goal: '', source: '' };
  const [v, setV] = useState(empty);
  const { data: pipelines = [] } = usePipelines();
  const [pid, setPid] = useState<string>('');
  const [stageId, setStageId] = useState<string>('');
  const pipeline = pipelines.find((p) => p.id === pid);
  const boardStages = (pipeline?.stages ?? []).filter((s) => s.category !== 'archived');
  useEffect(() => {
    if (!open || !pipelines.length) return;
    const p = pipelines.find((x) => x.id === pipelineId) ?? pipelines.find((x) => x.is_default) ?? pipelines[0];
    setPid(p.id);
    setStageId((p.stages.find((s) => s.category === 'enquiry') ?? p.stages[0])?.id ?? '');
  }, [open, pipelineId, pipelines]);
  const pickPipeline = (id: string) => {
    const p = pipelines.find((x) => x.id === id);
    setPid(id);
    setStageId((p?.stages.find((s) => s.category !== 'archived'))?.id ?? '');
  };
  const [billType, setBillType] = useState('none');
  const [rate, setRate] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(v);
    if (!parsed.success) {
      setErr(parsed.error.issues[0].path[0] === 'display_name' ? t.crm_name_required : parsed.error.issues[0].message);
      return;
    }
    try {
      const st = boardStages.find((s) => s.id === stageId);
      const row = await create.mutateAsync({ ...parsed.data, stage: (st?.category ?? 'enquiry') as any, stage_id: st?.id } as any);
      if (billType !== 'none' || rate.trim()) await update.mutateAsync({ id: row.id, billing_type: billType, rate: rate.trim() && Number(rate) >= 0 ? Math.round(Number(rate) * 100) / 100 : null });
      setBillType('none'); setRate('');
      setV(empty); setErr(null);
      onOpenChange(false);
      onCreated?.(row.id);
    } catch {
      toast.error(t.crm_error);
    }
  };

  const field = (k: keyof typeof empty, label: string, type = 'text', ph?: string) => (
    <label className="block space-y-1">
      <span className={portalLabel}>{label}</span>
      <input type={type} className={portalInput} value={v[k]} placeholder={ph} onChange={(e) => setV({ ...v, [k]: e.target.value })} />
    </label>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="coach-portal bg-portal-card border-portal-border rounded-[4px] max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-[0.1em] text-portal-ink">{t.crm_new_client}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          {field('display_name', `${t.crm_name} *`)}
          <div className="grid grid-cols-2 gap-3">
            {field('phone', t.crm_phone, 'tel')}
            {field('email', t.crm_email, 'email')}
          </div>
          <p className="text-xs text-portal-muted">{t.crm_private_helper}</p>
          {field('goal', t.crm_goal)}
          {field('source', t.crm_source, 'text', t.crm_source_ph)}
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className={portalLabel}>{t.crm_pipeline}</span>
              <select className={portalInput} value={pid} onChange={(e) => pickPipeline(e.target.value)}>
                {pipelines.map((p) => <option key={p.id} value={p.id}>{pipelineLabel(p, t)}</option>)}
              </select>
            </label>
            <label className="block space-y-1">
              <span className={portalLabel}>{t.crm_stage}</span>
              <select className={portalInput} value={stageId} onChange={(e) => setStageId(e.target.value)}>
                {boardStages.map((s) => <option key={s.id} value={s.id}>{stageLabel(s, t)}</option>)}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className={portalLabel}>{t.bill_type}</span>
              <select className={portalInput} value={billType} onChange={(e) => setBillType(e.target.value)}>
                {BILL_TYPES.map((b) => <option key={b} value={b}>{t[`bill_${b}`]}</option>)}
              </select>
            </label>
            <label className="block space-y-1">
              <span className={portalLabel}>{t.bill_rate}</span>
              <input type="number" min={0} step="0.01" className={portalInput} value={rate} onChange={(e) => setRate(e.target.value)} />
            </label>
          </div>
          {err && <p className="text-sm text-portal-coral-text">{err}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className={portalBtnGhost} onClick={() => onOpenChange(false)}>{t.crm_cancel}</button>
            <button type="submit" className={portalBtnPrimary} disabled={create.isPending}>{t.crm_create}</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { ALL_STAGES };
