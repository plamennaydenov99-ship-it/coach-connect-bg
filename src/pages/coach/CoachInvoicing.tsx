import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/context/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCoachTz } from '@/hooks/coach/useCoachCalendar';
import { useClientList } from '@/hooks/coach/useCoachClients';
import {
  daysLate, isOverdue, remaining, useBillingSettings, useCreateDraftsForPeriod, useCreateRequest, useDeleteDraft,
  useDeleteLine, useDeletePayment, usePaymentRequests, useRecordPayment, useRequestDetail, useSaveLine, useUpdateRequest,
  type PaymentRequest, type RequestLine,
} from '@/hooks/coach/usePaymentRequests';
import { LOCALES, fmtDate, portalBtnGhost, portalBtnPrimary, portalInput, portalLabel } from '@/components/coach/clients/shared';
import { addDays, addMonths, startOfMonth, todayStr, type DateStr } from '@/lib/tz';
import type { LineLabels } from '@/lib/revenue';

const card = 'bg-portal-card border border-portal-border rounded-[4px]';
const h1 = 'font-display uppercase text-3xl tracking-[0.06em] text-portal-ink';
type Tab = 'outstanding' | 'drafts' | 'paid' | 'all';
type Age = 'not_due' | 'd1_30' | 'd31_60' | 'd60';
const ageOf = (r: PaymentRequest, today: DateStr): Age => {
  const d = daysLate(r, today);
  return d === 0 ? 'not_due' : d <= 30 ? 'd1_30' : d <= 60 ? 'd31_60' : 'd60';
};

function useEur() {
  const { lang } = useLanguage();
  return (n: number) => new Intl.NumberFormat(LOCALES[lang], { style: 'currency', currency: 'EUR' }).format(n);
}
function useLineLabels(): LineLabels {
  const { t } = useLanguage();
  return { session: t.inv_line_session, group: t.inv_line_group, trial: t.inv_line_trial, weekly: t.inv_line_weekly, monthly: t.inv_line_monthly };
}

export default function CoachInvoicing() {
  const { t, lang } = useLanguage();
  const tz = useCoachTz();
  const eur = useEur();
  const today = todayStr(tz);
  const [params, setParams] = useSearchParams();
  const clientFilter = params.get('client');
  const { data, isLoading } = usePaymentRequests();
  const { data: clients = [] } = useClientList();
  const [tab, setTab] = useState<Tab>('outstanding');
  const [age, setAge] = useState<Age | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [periodOpen, setPeriodOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);

  const requests = useMemo(() => (data?.requests ?? []).filter((r) => !clientFilter || r.client_id === clientFilter), [data, clientFilter]);
  const payments = data?.payments ?? [];

  const outstandingList = requests.filter((r) => remaining(r) > 0);
  const outstanding = outstandingList.reduce((s, r) => s + remaining(r), 0);
  const overdue = outstandingList.filter((r) => isOverdue(r, today)).reduce((s, r) => s + remaining(r), 0);
  const reqIds = new Set(requests.map((r) => r.id));
  const collected = payments.filter((p) => reqIds.has(p.request_id) && p.paid_on >= startOfMonth(today)).reduce((s, p) => s + Number(p.amount), 0);
  const issued90 = requests.filter((r) => r.status !== 'draft' && r.status !== 'void' && r.issue_date && r.issue_date >= addDays(today, -90));
  const issuedTotal = issued90.reduce((s, r) => s + Number(r.total), 0);
  const rate = issuedTotal > 0 ? Math.round((issued90.reduce((s, r) => s + Number(r.paid_amount), 0) / issuedTotal) * 100) : null;
  const aging = (['not_due', 'd1_30', 'd31_60', 'd60'] as Age[]).map((a) => ({
    a, amount: outstandingList.filter((r) => ageOf(r, today) === a).reduce((s, r) => s + remaining(r), 0),
  }));

  const shown = requests.filter((r) => {
    if (tab === 'outstanding') return remaining(r) > 0 && (!age || ageOf(r, today) === age);
    if (tab === 'drafts') return r.status === 'draft';
    if (tab === 'paid') return r.status === 'paid';
    return true;
  });
  const filterName = clientFilter ? clients.find((c) => c.id === clientFilter)?.display_name : null;

  const Chip = ({ r }: { r: PaymentRequest }) => {
    const over = isOverdue(r, today);
    return (
      <span className={`text-xs px-2 py-0.5 rounded-[4px] border border-portal-border ${over ? 'text-portal-coral-text' : r.status === 'paid' ? 'text-portal-success' : 'text-portal-muted-strong'}`}>
        {over ? t.inv_overdue : t[`inv_status_${r.status}`]}
      </span>
    );
  };
  const period = (r: PaymentRequest) => r.period_start && r.period_end ? `${fmtDate(r.period_start, lang)} – ${fmtDate(r.period_end, lang)}` : '—';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className={h1}>{t.inv_section}</h1>
          <p className="text-portal-muted-strong mt-1">{t.inv_sub}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={portalBtnGhost} onClick={() => setPeriodOpen(true)}>{t.inv_create_period}</button>
          <button className={portalBtnPrimary} onClick={() => setNewOpen(true)}><Plus className="h-4 w-4 mr-1 inline" />{t.inv_new}</button>
        </div>
      </div>

      {filterName && (
        <div className="inline-flex items-center gap-2 text-sm px-3 h-9 rounded-[4px] border border-portal-selected-border bg-portal-selected text-portal-ink">
          {filterName}
          <button aria-label={t.crm_cancel} onClick={() => { params.delete('client'); setParams(params); }}><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />) : [
          { label: t.inv_tab_outstanding, value: eur(outstanding) },
          { label: t.inv_overdue, value: eur(overdue), coral: overdue > 0 },
          { label: t.inv_collected_month, value: eur(collected) },
          { label: t.inv_collection_rate, value: rate === null ? '—' : `${rate}%` },
        ].map((k) => (
          <div key={k.label} className={`${card} p-4`}>
            <div className={portalLabel}>{k.label}</div>
            <div className={`font-display text-2xl mt-1 ${k.coral ? 'text-portal-coral-text' : 'text-portal-ink'}`}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className={`${card} p-2 grid grid-cols-2 md:grid-cols-4 gap-2`}>
        {aging.map(({ a, amount }) => (
          <button key={a} onClick={() => { setTab('outstanding'); setAge(age === a ? null : a); }}
            className={`text-left px-3 py-2 rounded-[4px] border ${age === a ? 'bg-portal-selected border-portal-selected-border' : 'border-transparent hover:bg-portal-bg'}`}>
            <div className={portalLabel}>{t[`inv_age_${a}`]}</div>
            <div className={`text-sm ${a !== 'not_due' && amount > 0 ? 'text-portal-coral-text' : 'text-portal-ink'}`}>{eur(amount)}</div>
          </button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['outstanding', 'drafts', 'paid', 'all'] as Tab[]).map((x) => (
          <button key={x} onClick={() => { setTab(x); if (x !== 'outstanding') setAge(null); }}
            className={`h-9 px-3 rounded-[4px] border text-sm ${tab === x ? 'bg-portal-selected border-portal-selected-border text-portal-ink' : 'border-portal-border text-portal-muted-strong hover:text-portal-ink'}`}>
            {t[`inv_tab_${x}`]}
          </button>
        ))}
      </div>

      <div className={card}>
        {isLoading ? <div className="p-4"><Skeleton className="h-24" /></div> : !shown.length ? (
          <p className="p-8 text-center text-sm text-portal-muted">{t.inv_empty}</p>
        ) : (
          <>
            <table className="hidden md:table w-full text-sm">
              <thead><tr className="text-left border-b border-portal-border">
                {[t.inv_number, t.inv_client, t.inv_period, t.inv_due, t.inv_total, t.inv_remaining, t.inv_status].map((h) => <th key={h} className={`${portalLabel} px-4 py-2 font-normal`}>{h}</th>)}
              </tr></thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id} onClick={() => setOpenId(r.id)} className="border-b border-portal-border last:border-0 cursor-pointer hover:bg-portal-bg">
                    <td className="px-4 py-3 text-portal-ink">{r.number ?? t.inv_status_draft}</td>
                    <td className="px-4 py-3 text-portal-ink">{r.client?.display_name ?? '—'}</td>
                    <td className="px-4 py-3 text-portal-muted-strong">{period(r)}</td>
                    <td className="px-4 py-3 text-portal-muted-strong">{r.due_date ? fmtDate(r.due_date, lang) : '—'}</td>
                    <td className="px-4 py-3 text-portal-ink">{eur(Number(r.total))}</td>
                    <td className="px-4 py-3 text-portal-ink">{eur(remaining(r))}</td>
                    <td className="px-4 py-3"><Chip r={r} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="md:hidden divide-y divide-portal-border">
              {shown.map((r) => (
                <li key={r.id}>
                  <button onClick={() => setOpenId(r.id)} className="w-full text-left p-4 space-y-1">
                    <div className="flex justify-between gap-2"><span className="text-portal-ink font-medium truncate">{r.client?.display_name ?? '—'}</span><Chip r={r} /></div>
                    <div className="flex justify-between gap-2 text-sm text-portal-muted-strong">
                      <span>{r.number ?? t.inv_status_draft} · {r.due_date ? fmtDate(r.due_date, lang) : '—'}</span>
                      <span className="text-portal-ink">{eur(remaining(r) || Number(r.total))}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <PeriodDialog open={periodOpen} onOpenChange={setPeriodOpen} today={today} />
      <NewRequestDialog open={newOpen} onOpenChange={setNewOpen} today={today} defaultClient={clientFilter} onCreated={setOpenId} />
      <RequestSheet id={openId} onClose={() => setOpenId(null)} today={today} />
    </div>
  );
}

const lastMonth = (today: DateStr) => ({ from: addMonths(today, -1), to: addDays(startOfMonth(today), -1) });

function PeriodDialog({ open, onOpenChange, today }: { open: boolean; onOpenChange: (o: boolean) => void; today: DateStr }) {
  const { t } = useLanguage();
  const labels = useLineLabels();
  const create = useCreateDraftsForPeriod();
  const [p, setP] = useState(lastMonth(today));
  const run = async () => {
    if (!p.from || !p.to || p.from > p.to) return toast.error(t.crm_error);
    try {
      const n = await create.mutateAsync({ ...p, labels });
      toast.success(n ? t.inv_drafts_created.replace('{n}', String(n)) : t.inv_drafts_none);
      onOpenChange(false);
    } catch { toast.error(t.crm_error); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="coach-portal bg-portal-card border-portal-border rounded-[4px] max-w-sm">
        <DialogHeader><DialogTitle className="font-display uppercase tracking-[0.1em] text-portal-ink">{t.inv_create_period}</DialogTitle></DialogHeader>
        <p className="text-sm text-portal-muted-strong">{t.inv_create_period_sub}</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1"><span className={portalLabel}>{t.inv_from}</span><input type="date" className={portalInput} value={p.from} onChange={(e) => setP({ ...p, from: e.target.value })} /></label>
          <label className="space-y-1"><span className={portalLabel}>{t.inv_to}</span><input type="date" className={portalInput} value={p.to} onChange={(e) => setP({ ...p, to: e.target.value })} /></label>
        </div>
        <div className="flex justify-end gap-2">
          <button className={portalBtnGhost} onClick={() => onOpenChange(false)}>{t.crm_cancel}</button>
          <button className={portalBtnPrimary} onClick={run} disabled={create.isPending}>{t.crm_create}</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NewRequestDialog({ open, onOpenChange, today, defaultClient, onCreated }: {
  open: boolean; onOpenChange: (o: boolean) => void; today: DateStr; defaultClient: string | null; onCreated: (id: string) => void;
}) {
  const { t } = useLanguage();
  const labels = useLineLabels();
  const { data: clients = [] } = useClientList();
  const create = useCreateRequest();
  const [clientId, setClientId] = useState(defaultClient ?? '');
  const [p, setP] = useState(lastMonth(today));
  const cid = clientId || defaultClient || '';
  const run = async () => {
    if (!cid || !p.from || !p.to || p.from > p.to) return toast.error(t.crm_error);
    try {
      const id = await create.mutateAsync({ clientId: cid, ...p, labels });
      onOpenChange(false);
      onCreated(id);
    } catch { toast.error(t.crm_error); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="coach-portal bg-portal-card border-portal-border rounded-[4px] max-w-sm">
        <DialogHeader><DialogTitle className="font-display uppercase tracking-[0.1em] text-portal-ink">{t.inv_new}</DialogTitle></DialogHeader>
        <label className="space-y-1 block"><span className={portalLabel}>{t.inv_client}</span>
          <select className={portalInput} value={cid} onChange={(e) => setClientId(e.target.value)}>
            <option value="">—</option>
            {clients.filter((c) => c.stage !== 'archived').map((c) => <option key={c.id} value={c.id}>{c.display_name}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1"><span className={portalLabel}>{t.inv_from}</span><input type="date" className={portalInput} value={p.from} onChange={(e) => setP({ ...p, from: e.target.value })} /></label>
          <label className="space-y-1"><span className={portalLabel}>{t.inv_to}</span><input type="date" className={portalInput} value={p.to} onChange={(e) => setP({ ...p, to: e.target.value })} /></label>
        </div>
        <div className="flex justify-end gap-2">
          <button className={portalBtnGhost} onClick={() => onOpenChange(false)}>{t.crm_cancel}</button>
          <button className={portalBtnPrimary} onClick={run} disabled={create.isPending || !cid}>{t.crm_create}</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RequestSheet({ id, onClose, today }: { id: string | null; onClose: () => void; today: DateStr }) {
  const { t, lang } = useLanguage();
  const eur = useEur();
  const mobile = useIsMobile();
  const { data } = useRequestDetail(id);
  const { data: settings } = useBillingSettings();
  const update = useUpdateRequest();
  const del = useDeleteDraft();
  const r = data?.request;
  const draft = r?.status === 'draft';
  const rem = r ? remaining(r) : 0;

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side={mobile ? 'bottom' : 'right'} className={`coach-portal bg-portal-card border-portal-border overflow-y-auto ${mobile ? 'max-h-[90vh]' : 'w-full sm:max-w-lg'}`}>
        <SheetTitle className="font-display uppercase tracking-[0.1em] text-portal-ink">{t.inv_document}{r?.number ? ` · ${r.number}` : ''}</SheetTitle>
        <SheetDescription className="text-portal-muted-strong">{r?.client?.display_name ?? ''}</SheetDescription>
        {!r ? <Skeleton className="h-40 mt-4" /> : (
          <div key={r.id + r.updated_at} className="space-y-5 mt-4">
            <div className="flex flex-wrap gap-2 items-center text-sm">
              <span className={`px-2 py-0.5 rounded-[4px] border border-portal-border ${isOverdue(r, today) ? 'text-portal-coral-text' : 'text-portal-muted-strong'}`}>
                {isOverdue(r, today) ? t.inv_overdue : t[`inv_status_${r.status}`]}
              </span>
              {r.period_start && r.period_end && <span className="text-portal-muted">{fmtDate(r.period_start, lang)} – {fmtDate(r.period_end, lang)}</span>}
            </div>

            <Lines requestId={r.id} lines={data!.lines} editable={draft} />
            <div className="flex justify-between font-display text-xl text-portal-ink border-t border-portal-border pt-3">
              <span>{t.inv_total}</span><span>{eur(Number(r.total))}</span>
            </div>

            <MetaForm r={r} />

            {!draft && r.status !== 'void' && <Payments requestId={r.id} payments={data!.payments} rem={rem} />}

            {(settings?.payment_link || settings?.iban) && (
              <div className="rounded-[4px] border border-portal-border p-3 text-sm space-y-1">
                <div className={portalLabel}>{t.inv_how_to_pay}</div>
                {settings.payment_link && <a href={settings.payment_link} target="_blank" rel="noopener noreferrer" className="block text-portal-blue hover:underline break-all">{settings.payment_link}</a>}
                {settings.iban && <div className="text-portal-ink">IBAN: <span className="font-mono">{settings.iban}</span></div>}
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2 border-t border-portal-border">
              {draft && <button className={portalBtnPrimary} disabled={update.isPending || Number(r.total) <= 0} onClick={() => update.mutate({ id: r.id, status: 'sent' })}>{t.inv_mark_sent}</button>}
              {(draft || ((r.status === 'sent' || r.status === 'partially_paid') && Number(r.paid_amount) === 0)) && (
                <button className={`${portalBtnGhost} text-portal-coral-text`} onClick={() => update.mutate({ id: r.id, status: 'void' })}>{t.inv_void}</button>
              )}
              {draft && <button className={portalBtnGhost} onClick={() => del.mutate(r.id, { onSuccess: onClose, onError: () => toast.error(t.crm_error) })}>{t.inv_delete_draft}</button>}
            </div>
            <p className="text-xs text-portal-muted">{t.inv_disclaimer}</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function MetaForm({ r }: { r: PaymentRequest }) {
  const { t } = useLanguage();
  const update = useUpdateRequest();
  const [due, setDue] = useState(r.due_date ?? '');
  const [notes, setNotes] = useState(r.notes ?? '');
  if (r.status === 'void') return r.notes ? <p className="text-sm text-portal-muted-strong whitespace-pre-wrap">{r.notes}</p> : null;
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); update.mutate({ id: r.id, due_date: due || null, notes: notes.trim().slice(0, 1000) || null }); }}>
      <label className="block space-y-1"><span className={portalLabel}>{t.inv_due}</span>
        <input type="date" className={portalInput} value={due} onChange={(e) => setDue(e.target.value)} /></label>
      <label className="block space-y-1"><span className={portalLabel}>{t.inv_notes}</span>
        <textarea rows={2} maxLength={1000} className={`${portalInput} h-auto py-2`} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
      <button type="submit" className={portalBtnGhost} disabled={update.isPending}>{t.crm_save}</button>
    </form>
  );
}

function Lines({ requestId, lines, editable }: { requestId: string; lines: RequestLine[]; editable: boolean }) {
  const { t } = useLanguage();
  const eur = useEur();
  const save = useSaveLine();
  const remove = useDeleteLine();
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-2">
      <div className={portalLabel}>{t.inv_lines}</div>
      {!lines.length && <p className="text-sm text-portal-muted">{t.inv_no_lines}</p>}
      {lines.map((l) => editable
        ? <LineEditor key={l.id + l.unit_price + l.qty + l.description} line={l} onSave={(v) => save.mutate({ id: l.id, request_id: requestId, ...v })} onRemove={() => remove.mutate(l.id)} />
        : (
          <div key={l.id} className="flex justify-between gap-2 text-sm">
            <span className="text-portal-ink">{l.description}{Number(l.qty) !== 1 ? ` × ${Number(l.qty)}` : ''}</span>
            <span className="text-portal-ink shrink-0">{eur(Number(l.amount ?? 0))}</span>
          </div>
        ))}
      {editable && (adding
        ? <LineEditor onSave={(v) => save.mutate({ request_id: requestId, position: lines.length, ...v }, { onSuccess: () => setAdding(false) })} onRemove={() => setAdding(false)} />
        : <button className="text-sm text-portal-blue hover:underline inline-flex items-center gap-1" onClick={() => setAdding(true)}><Plus className="h-4 w-4" />{t.inv_add_line}</button>)}
    </div>
  );
}

function LineEditor({ line, onSave, onRemove }: { line?: RequestLine; onSave: (v: { description: string; qty: number; unit_price: number }) => void; onRemove: () => void }) {
  const { t } = useLanguage();
  const [d, setD] = useState(line?.description ?? '');
  const [q, setQ] = useState(String(line?.qty ?? 1));
  const [p, setP] = useState(line ? String(line.unit_price) : '');
  const dirty = !line || d !== line.description || Number(q) !== Number(line.qty) || Number(p) !== Number(line.unit_price);
  const submit = () => {
    const qty = Number(q), price = Number(p);
    if (!d.trim() || !Number.isFinite(qty) || qty <= 0 || !Number.isFinite(price) || price < 0) return toast.error(t.crm_error);
    onSave({ description: d, qty: Math.round(qty * 100) / 100, unit_price: Math.round(price * 100) / 100 });
  };
  return (
    <div className="grid grid-cols-[1fr_56px_80px_auto] gap-1.5 items-center">
      <input className={portalInput} value={d} maxLength={200} placeholder={t.inv_line_desc} onChange={(e) => setD(e.target.value)} aria-label={t.inv_line_desc} />
      <input className={portalInput} type="number" min={0} step="0.5" value={q} onChange={(e) => setQ(e.target.value)} aria-label={t.inv_qty} />
      <input className={portalInput} type="number" min={0} step="0.01" value={p} placeholder="€" onChange={(e) => setP(e.target.value)} aria-label={t.inv_unit_price} />
      <div className="flex">
        {dirty && <button className="text-xs text-portal-blue px-1.5 hover:underline" onClick={submit}>{t.crm_save}</button>}
        <button className="p-1.5 text-portal-muted hover:text-portal-coral-text" aria-label={t.inv_remove_line} onClick={onRemove}><Trash2 className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

function Payments({ requestId, payments, rem }: { requestId: string; payments: { id: string; amount: number; paid_on: string; method: string }[]; rem: number }) {
  const { t, lang } = useLanguage();
  const eur = useEur();
  const tz = useCoachTz();
  const record = useRecordPayment();
  const delP = useDeletePayment();
  const [amount, setAmount] = useState(rem.toFixed(2));
  const [date, setDate] = useState(todayStr(tz));
  const [method, setMethod] = useState<'cash' | 'bank' | 'card' | 'other'>('bank');
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const a = Math.round(Number(amount) * 100) / 100;
    if (!(a > 0) || a > rem + 0.001) return toast.error(t.inv_amount_error);
    record.mutate({ request_id: requestId, amount: a, paid_on: date, method });
  };
  return (
    <div className="space-y-3">
      <div className={portalLabel}>{t.inv_payments}</div>
      {!payments.length ? <p className="text-sm text-portal-muted">{t.inv_no_payments}</p> : payments.map((p) => (
        <div key={p.id} className="flex justify-between items-center gap-2 text-sm">
          <span className="text-portal-ink">{fmtDate(p.paid_on, lang)} · {t[`inv_method_${p.method}`]}</span>
          <span className="flex items-center gap-1 text-portal-ink">{eur(Number(p.amount))}
            <button aria-label={t.inv_remove_line} className="p-1 text-portal-muted hover:text-portal-coral-text" onClick={() => delP.mutate(p.id)}><Trash2 className="h-3.5 w-3.5" /></button>
          </span>
        </div>
      ))}
      {rem > 0 && (
        <form onSubmit={submit} className="grid grid-cols-2 gap-2 rounded-[4px] border border-portal-border p-3">
          <label className="space-y-1"><span className={portalLabel}>{t.inv_amount}</span><input type="number" min={0.01} step="0.01" max={rem} className={portalInput} value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
          <label className="space-y-1"><span className={portalLabel}>{t.inv_paid_on}</span><input type="date" className={portalInput} value={date} onChange={(e) => setDate(e.target.value)} /></label>
          <label className="space-y-1 col-span-2"><span className={portalLabel}>{t.inv_method}</span>
            <select className={portalInput} value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
              {(['bank', 'cash', 'card', 'other'] as const).map((m) => <option key={m} value={m}>{t[`inv_method_${m}`]}</option>)}
            </select>
          </label>
          <button type="submit" className={`${portalBtnPrimary} col-span-2`} disabled={record.isPending}>{t.inv_record_payment}</button>
        </form>
      )}
    </div>
  );
}
