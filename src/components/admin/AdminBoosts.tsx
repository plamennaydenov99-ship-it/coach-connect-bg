import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { rpc } from '@/lib/trending';

type Row = { id: string; advertiser_name: string | null; session_title: string | null; placement: 'row' | 'pick'; city: string; starts_on: string; ends_on: string; price_eur: number; status: string; payment: string; review_note: string | null; created_at: string };

/** Staff queue for promoted places: approve or decline, then track the invoice by hand. */
export function AdminBoosts() {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const list = useQuery({ queryKey: ['admin', 'campaigns'], queryFn: async () => { const { data, error } = await rpc<Row[]>('admin_campaigns'); if (error) throw new Error(error.message); return data ?? []; } });
  const done = () => qc.invalidateQueries({ queryKey: ['admin', 'campaigns'] });
  const review = useMutation({
    mutationFn: async (a: { id: string; approve: boolean }) => { const { error } = await rpc('admin_review_campaign', { p_id: a.id, p_approve: a.approve, p_note: notes[a.id] ?? null }); if (error) throw new Error(error.message); },
    onSuccess: done, onError: (e) => toast.error((e as Error).message),
  });
  const pay = useMutation({
    mutationFn: async (a: { id: string; payment: string }) => { const { error } = await rpc('admin_set_campaign_payment', { p_id: a.id, p_payment: a.payment }); if (error) throw new Error(error.message); },
    onSuccess: done, onError: (e) => toast.error((e as Error).message),
  });
  const rows = list.data ?? [];
  return (
    <section className="mt-16" aria-labelledby="h-boosts">
      <h2 id="h-boosts" className="text-4xl">{t.ab_title}</h2>
      <p className="mb-6 mt-2 max-w-[60ch] text-portal-muted">{t.ab_sub}</p>
      {rows.length === 0 && <p className="border border-portal-border bg-portal-card p-6">{t.ab_none}</p>}
      <div className="flex flex-col gap-2">
        {rows.map(r => (
          <article key={r.id} className="grid gap-4 border border-portal-border bg-portal-card p-5 md:grid-cols-[minmax(0,1.4fr)_1fr_auto] md:items-center">
            <div className="min-w-0">
              <p className="text-lg font-semibold leading-tight">{r.session_title}</p>
              <p className="text-sm text-portal-muted">{r.advertiser_name} · {r.placement === 'row' ? t.bo_row : t.bo_pick} · {r.city} · {r.starts_on} → {r.ends_on} · €{Number(r.price_eur).toFixed(2)}</p>
              <p className="mt-1 text-sm"><span className="font-semibold">{t.ab_status}:</span> {r.status} · <span className="font-semibold">{t.ab_payment}:</span> {r.payment}</p>
            </div>
            {r.status === 'in_review' ? (
              <input value={notes[r.id] ?? ''} onChange={e => setNotes({ ...notes, [r.id]: e.target.value })} placeholder={t.ab_note} aria-label={t.ab_note} maxLength={240} className="h-11 w-full border border-portal-input bg-portal-card px-3 text-base" />
            ) : <p className="text-sm text-portal-muted">{r.review_note}</p>}
            <div className="flex flex-wrap gap-2">
              {r.status === 'in_review' && (<>
                <button type="button" onClick={() => review.mutate({ id: r.id, approve: true })} className="h-11 bg-portal-copper px-5 font-display text-base font-bold uppercase text-portal-on-copper hover:bg-portal-copper-hover">{t.ab_approve}</button>
                <button type="button" onClick={() => review.mutate({ id: r.id, approve: false })} className="h-11 bg-portal-bg px-5 font-display text-base font-bold uppercase hover:bg-portal-border">{t.ab_decline}</button>
              </>)}
              {r.status === 'approved' && r.payment !== 'paid' && (
                <button type="button" onClick={() => pay.mutate({ id: r.id, payment: r.payment === 'unpaid' ? 'invoiced' : 'paid' })} className="h-11 bg-portal-bg px-5 text-base font-semibold hover:bg-portal-border">{r.payment === 'unpaid' ? t.ab_mark_invoiced : t.ab_mark_paid}</button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
