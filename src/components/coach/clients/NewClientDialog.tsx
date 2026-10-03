import { useState } from 'react';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLanguage } from '@/context/LanguageContext';
import { ALL_STAGES, BOARD_STAGES, useCreateClient, type Stage } from '@/hooks/coach/useCoachClients';
import { portalBtnGhost, portalBtnPrimary, portalInput, portalLabel, stageKey } from './shared';
import { toast } from 'sonner';

const schema = z.object({
  display_name: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(40),
  email: z.union([z.literal(''), z.string().trim().email().max(255)]),
  goal: z.string().trim().max(300),
  source: z.string().trim().max(120),
});

export function NewClientDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated?: (id: string) => void }) {
  const { t } = useLanguage();
  const create = useCreateClient();
  const empty = { display_name: '', phone: '', email: '', goal: '', source: '' };
  const [v, setV] = useState(empty);
  const [stage, setStage] = useState<Stage>('enquiry');
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(v);
    if (!parsed.success) {
      setErr(parsed.error.issues[0].path[0] === 'display_name' ? t.crm_name_required : parsed.error.issues[0].message);
      return;
    }
    try {
      const row = await create.mutateAsync({ ...parsed.data, stage } as any);
      setV(empty); setStage('enquiry'); setErr(null);
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
          <div className="grid grid-cols-2 gap-3">
            {field('source', t.crm_source, 'text', t.crm_source_ph)}
            <label className="block space-y-1">
              <span className={portalLabel}>{t.crm_stage}</span>
              <select className={portalInput} value={stage} onChange={(e) => setStage(e.target.value as Stage)}>
                {BOARD_STAGES.map((s) => <option key={s} value={s}>{t[stageKey(s)]}</option>)}
              </select>
            </label>
          </div>
          {err && <p className="text-sm text-portal-copper">{err}</p>}
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
