import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import { DEFAULT_CITY, fetchTrending, rpc, whenLabel, type TrendRow } from '@/lib/trending';

type Sess = { id: string; title: string | null; starts_at: string; ends_at: string; capacity: number; price: number | null; is_public: boolean; sport: string | null; location: string | null; led_by: string | null };
type Campaign = { id: string; session_id: string; session_title: string | null; placement: 'row' | 'pick'; city: string; starts_on: string; ends_on: string; price_eur: number; status: string; effective_status: string; payment: string; review_note: string | null; views: number; clicks: number; requests: number };

const box = 'bg-portal-card border border-portal-border';
const stepBtn = 'grid h-10 w-10 place-items-center bg-portal-bg text-portal-ink transition-colors hover:bg-portal-border disabled:opacity-35 disabled:cursor-not-allowed';
const money = (n: number) => `€${Number(n).toFixed(n % 1 ? 2 : 0)}`;
const addDays = (d: number) => { const x = new Date(); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 10); };

function Stepper({ label, value, onDown, onUp, downOff, display }: { label: string; value: number; onDown: () => void; onUp: () => void; downOff?: boolean; display?: string }) {
  return (
    <div className="flex flex-col gap-1.5" role="group" aria-label={label}>
      <span className="text-[13px] font-semibold text-portal-muted-strong">{label}</span>
      <div className="flex items-center">
        <button type="button" className={stepBtn} onClick={onDown} disabled={downOff} aria-label={`− ${label}`}><Minus className="h-4 w-4" /></button>
        <output className="grid h-10 min-w-[56px] place-items-center bg-portal-bg px-2 text-lg font-bold tabular-nums">{display ?? value}</output>
        <button type="button" className={stepBtn} onClick={onUp} aria-label={`+ ${label}`}><Plus className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

export default function CoachBoost() {
  const { t, lang } = useLanguage();
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const uid = user?.id;
  const labels = { today: t.tn_today, tomorrow: t.tn_tomorrow };
  const [selected, setSelected] = useState<string | null>(null);
  const [placement, setPlacement] = useState<'row' | 'pick'>('row');
  const [startOffset, setStartOffset] = useState(0);
  const [len, setLen] = useState(3);
  const [headline, setHeadline] = useState('');

  const data = useQuery({
    queryKey: ['coach', uid, 'boost'],
    enabled: !!uid,
    refetchInterval: 60000,
    queryFn: async () => {
      const s = await supabase.from('coach_sessions').select('id, title, starts_at, ends_at, capacity, price, is_public, sport, location, led_by')
        .eq('coach_id', uid as string).eq('status', 'scheduled').not('capacity', 'is', null).gt('starts_at', new Date().toISOString()).order('starts_at').limit(30);
      if (s.error) throw s.error;
      const sessions = (s.data ?? []) as Sess[];
      const ids = sessions.map(x => x.id);
      const none = { data: [] as { session_id: string; status?: string }[], error: null };
      const [att, wait, req, trend, camps] = await Promise.all([
        ids.length ? supabase.from('session_attendees').select('session_id, status').in('session_id', ids).in('status', ['booked', 'attended']) : none,
        ids.length ? (supabase as unknown as { from: (t: string) => { select: (c: string) => { in: (c: string, v: string[]) => { in: (c: string, v: string[]) => Promise<{ data: { session_id: string }[] | null; error: unknown }> } } } }).from('session_waitlist').select('session_id').in('session_id', ids).in('status', ['waiting', 'offered']) : none,
        ids.length ? supabase.from('spot_requests').select('session_id').in('session_id', ids).eq('status', 'new') : none,
        fetchTrending(DEFAULT_CITY, 'all', 'all', 'week').catch(() => null),
        rpc<Campaign[]>('my_campaigns'),
      ]);
      const count = (rows: { session_id: string }[] | null) => { const m = new Map<string, number>(); for (const r of rows ?? []) m.set(r.session_id, (m.get(r.session_id) ?? 0) + 1); return m; };
      const ranks = new Map<string, TrendRow>((trend?.rows ?? []).map(r => [r.id, r]));
      return { sessions, booked: count(att.data), waiting: count(wait.data), asked: count(req.data), ranks, campaigns: camps.data ?? [] };
    },
  });

  const sessions = data.data?.sessions ?? [];
  const sel = sessions.find(x => x.id === selected) ?? sessions[0];
  const booked = (id: string) => data.data?.booked.get(id) ?? 0;
  const waiting = (id: string) => data.data?.waiting.get(id) ?? 0;

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Pick<Sess, 'capacity' | 'price' | 'is_public'>> }) => {
      const r = await supabase.from('coach_sessions').update(patch).eq('id', id).eq('coach_id', uid as string);
      if (r.error) throw r.error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coach', uid, 'boost'] }),
    onError: (e) => toast.error((e as { message?: string }).message || t.crm_error),
  });
  const addGroup = useMutation({
    mutationFn: async (s: Sess) => {
      const start = new Date(Date.parse(s.ends_at) + 30 * 60000), end = new Date(start.getTime() + (Date.parse(s.ends_at) - Date.parse(s.starts_at)));
      const r = await supabase.from('coach_sessions').insert({ coach_id: uid as string, title: s.title, sport: s.sport, kind: 'session', capacity: s.capacity, price: s.price, is_public: true, location: s.location, led_by: s.led_by, starts_at: start.toISOString(), ends_at: end.toISOString() });
      if (r.error) throw r.error;
    },
    onSuccess: () => { toast.success(t.bo_group_added); qc.invalidateQueries({ queryKey: ['coach', uid, 'boost'] }); },
    onError: (e) => toast.error((e as { message?: string }).message || t.crm_error),
  });
  const send = useMutation({
    mutationFn: async () => {
      if (!sel) throw new Error(t.bo_choose);
      const { error } = await rpc('create_campaign', { p_session: sel.id, p_placement: placement, p_start: addDays(startOffset), p_days: placement === 'pick' ? len : len, p_headline: headline.trim() || null });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => { toast.success(t.bo_sent); setHeadline(''); qc.invalidateQueries({ queryKey: ['coach', uid, 'boost'] }); },
    onError: (e) => toast.error((e as { message?: string }).message || t.crm_error),
  });
  const campaignAction = useMutation({
    mutationFn: async (a: { fn: 'withdraw_campaign' | 'set_campaign_paused'; args: Record<string, unknown> }) => { const { error } = await rpc(a.fn, a.args); if (error) throw new Error(error.message); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coach', uid, 'boost'] }),
    onError: (e) => toast.error((e as { message?: string }).message || t.crm_error),
  });

  const insight = sessions.find(s => waiting(s.id) >= 2 || (booked(s.id) >= s.capacity && (data.data?.asked.get(s.id) ?? 0) >= 1));
  const isRow = placement === 'row';
  const days = isRow ? Math.min(len, 14) : Math.min(len, 4) * 7;
  const price = (isRow ? 9 : 7) * days;
  const blockedReason = !sel ? t.bo_choose : !sel.is_public ? t.bo_blocked_hidden : booked(sel.id) >= sel.capacity ? t.bo_blocked_full : null;
  const statusLabel: Record<string, string> = { in_review: t.bo_st_review, approved: t.bo_st_approved, scheduled: t.bo_st_scheduled, live: t.bo_st_live, ended: t.bo_st_ended, declined: t.bo_st_declined, paused: t.bo_st_paused };
  const statusTone: Record<string, string> = { live: 'bg-success text-white', scheduled: 'bg-portal-selected text-portal-ink', in_review: 'bg-[#E5BE86] text-portal-ink', declined: 'bg-destructive text-white', paused: 'bg-portal-ink text-portal-card', ended: 'bg-portal-border text-portal-ink', approved: 'bg-portal-selected text-portal-ink' };

  if (profile && profile.role !== 'coach' && profile.role !== 'club') return null;

  return (
    <div className="container max-w-[1200px] py-8 md:py-12">
      <header className="mb-10 grid items-end gap-6 md:grid-cols-12">
        <h1 className="text-6xl md:col-span-6 md:text-8xl">{t.tn_boost}</h1>
        <p className="max-w-[30ch] text-xl md:col-span-5 md:col-start-8">{t.bo_sub}</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-12">
        <section className="lg:col-span-7" aria-labelledby="h-your">
          <h2 id="h-your" className="mb-5 text-4xl">{t.bo_your_sessions}</h2>
          {insight && (
            <div className="mb-4 grid items-center gap-4 bg-portal-blue p-6 text-white sm:grid-cols-[1fr_auto]">
              <div>
                <p className="font-display text-3xl font-extrabold uppercase leading-[0.95]" style={{ color: 'inherit' }}>{t.bo_insight_title.replace('{n}', String(Math.max(waiting(insight.id), data.data?.asked.get(insight.id) ?? 0))).replace('{title}', insight.title ?? '')}</p>
                <p className="mt-2 max-w-[46ch] text-base text-white/90">{t.bo_insight_body}</p>
              </div>
              <button type="button" disabled={addGroup.isPending} onClick={() => addGroup.mutate(insight)} className="h-12 bg-[#F3EDE2] px-5 font-display text-base font-bold uppercase text-portal-ink hover:bg-white disabled:opacity-60">{t.bo_add_group}</button>
            </div>
          )}
          {data.isLoading && <p className={`${box} p-6`}>…</p>}
          {!data.isLoading && sessions.length === 0 && <p className={`${box} p-6 text-lg`}>{t.bo_no_sessions}</p>}
          <div className="flex flex-col gap-2">
            {sessions.map(s => {
              const b = booked(s.id), left = Math.max(0, s.capacity - b), isSel = sel?.id === s.id, w = waiting(s.id), rk = data.data?.ranks.get(s.id);
              const status = !s.is_public ? t.bo_hidden : left === 0 ? t.bo_full_waitlist : rk ? t.bo_rank.replace('{n}', String(rk.rank)) : t.bo_not_ranked;
              return (
                <article key={s.id} className={`grid gap-5 p-5 transition-colors sm:grid-cols-[minmax(0,1fr)_auto] ${isSel ? 'bg-portal-ink text-portal-card' : box}`}>
                  <div className="min-w-0">
                    <h3 className="t-plain text-xl" style={{ color: 'inherit' }}>{s.title || t.group_type}</h3>
                    <p className="mt-0.5 text-sm opacity-85">{whenLabel(s.starts_at, lang, labels)} · {s.price != null ? money(s.price) : t.bo_free}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className={`inline-flex h-7 items-center px-2.5 text-sm font-semibold ${left === 0 && s.is_public ? 'bg-accent text-white' : isSel ? 'bg-portal-card text-portal-ink' : 'bg-portal-bg text-portal-ink'}`}>{status}</span>
                      {rk && s.is_public && left > 0 && <span className={`inline-flex h-7 items-center px-2.5 text-sm font-semibold ${isSel ? 'bg-portal-card text-portal-ink' : 'bg-portal-bg text-portal-ink'}`}>{t.tn_heat} {rk.heat}</span>}
                      {w > 0 && <span className="inline-flex h-7 items-center bg-accent px-2.5 text-sm font-semibold text-white">{t.bo_waiting.replace('{n}', String(w))}</span>}
                    </div>
                    <div className="mt-3 max-w-[300px]"><div className={`h-2.5 ${isSel ? 'bg-white/30' : 'bg-portal-bg'}`}><div className={`h-full ${isSel ? 'bg-portal-card' : 'bg-portal-blue'}`} style={{ width: `${Math.round((100 * b) / s.capacity)}%` }} /></div><p className="mt-1.5 text-sm tabular-nums">{left === 0 ? t.tn_full : t.tn_spots_of.replace('{left}', String(left)).replace('{cap}', String(s.capacity))}</p></div>
                  </div>
                  <div className="flex flex-wrap items-end gap-5 text-portal-ink">
                    <Stepper label={t.bo_places} value={s.capacity} downOff={s.capacity <= Math.max(1, b)} onDown={() => update.mutate({ id: s.id, patch: { capacity: s.capacity - 1 } })} onUp={() => update.mutate({ id: s.id, patch: { capacity: Math.min(40, s.capacity + 1) } })} />
                    <Stepper label={t.bo_price} value={s.price ?? 0} downOff={(s.price ?? 0) <= 0} onDown={() => update.mutate({ id: s.id, patch: { price: Math.max(0, (s.price ?? 0) - 5) } })} onUp={() => update.mutate({ id: s.id, patch: { price: Math.min(120, (s.price ?? 0) + 5) } })} />
                    <div className="flex flex-col gap-1.5">
                      <span className={`text-[13px] font-semibold ${isSel ? 'text-portal-card' : 'text-portal-muted-strong'}`} id={`pub-${s.id}`}>{t.bo_public}</span>
                      <button type="button" role="switch" aria-checked={s.is_public} aria-labelledby={`pub-${s.id}`} onClick={() => update.mutate({ id: s.id, patch: { is_public: !s.is_public } })} className={`relative h-8 w-[54px] transition-colors ${s.is_public ? 'bg-portal-blue' : 'bg-portal-border'}`}>
                        <span className={`absolute left-1 top-1 h-6 w-6 transition-transform ${s.is_public ? 'translate-x-[22px] bg-white' : 'bg-portal-ink'}`} />
                      </button>
                    </div>
                    <button type="button" onClick={() => setSelected(s.id)} className={`h-10 px-4 font-display text-sm font-bold uppercase ${isSel ? 'bg-portal-card text-portal-ink' : 'bg-portal-copper text-portal-on-copper hover:bg-portal-copper-hover'}`}>{isSel ? t.bo_selected : t.bo_promote}</button>
                  </div>
                  {s.capacity > b && w > 0 && <p className="col-span-full bg-portal-bg p-3 text-sm text-portal-ink">{t.bo_note_waitlist.replace('{n}', String(Math.min(w, s.capacity - b)))}</p>}
                </article>
              );
            })}
          </div>
        </section>

        <section className={`${box} h-fit p-6 md:p-8 lg:col-span-5`} aria-labelledby="h-wiz">
          <h2 id="h-wiz" className="text-4xl">{t.bo_wiz_title}</h2>
          <p className="mb-6 mt-1 text-sm text-portal-muted">{sel ? `${sel.title ?? t.group_type} · ${whenLabel(sel.starts_at, lang, labels)}` : ''}</p>
          {blockedReason && <p className="mb-5 bg-portal-bg p-3 text-sm">{blockedReason}</p>}
          <h3 className="t-plain mb-2 text-lg">{t.bo_where}</h3>
          {([['row', t.bo_row, t.bo_row_d, '€9'], ['pick', t.bo_pick, t.bo_pick_d, '€7']] as const).map(([k, name, desc, per]) => (
            <button key={k} type="button" aria-pressed={placement === k} onClick={() => { setPlacement(k); setLen(k === 'pick' ? 1 : 3); }} className={`mb-1.5 grid w-full grid-cols-[1fr_auto] gap-x-4 gap-y-1 p-4 text-left transition-colors ${placement === k ? 'bg-portal-ink text-portal-card' : 'bg-portal-bg hover:bg-portal-border'}`}>
              <span className="text-base font-bold">{name}</span><span className="font-bold">{per} {t.bo_a_day}</span><span className="col-span-2 text-sm opacity-85">{desc}</span>
            </button>
          ))}
          <h3 className="t-plain mb-2 mt-6 text-lg">{t.bo_when}</h3>
          <div className="mb-3 flex flex-wrap gap-1.5">{[[0, t.tn_today], [1, t.tn_tomorrow], [2, t.bo_in2]].map(([k, label]) => <button key={String(k)} type="button" aria-pressed={startOffset === k} onClick={() => setStartOffset(k as number)} className={`h-10 px-4 text-base font-medium ${startOffset === k ? 'bg-portal-ink text-portal-card' : 'bg-portal-bg hover:bg-portal-border'}`}>{label}</button>)}</div>
          <Stepper label={isRow ? t.bo_days : t.bo_weeks} value={len} downOff={len <= 1} onDown={() => setLen(Math.max(1, len - 1))} onUp={() => setLen(Math.min(isRow ? 14 : 4, len + 1))} />
          <label htmlFor="bo-headline" className="t-plain mb-2 mt-6 block text-lg">{t.bo_headline}</label>
          <input id="bo-headline" value={headline} maxLength={80} onChange={e => setHeadline(e.target.value)} placeholder={sel?.title ?? ''} className="h-11 w-full border border-portal-input bg-portal-card px-3 text-base" />
          <h3 className="t-plain mb-2 mt-6 text-lg">{t.bo_preview}</h3>
          <div className="grid gap-2 bg-portal-blue p-5 text-white">
            <span className="w-fit bg-[#F3EDE2] px-3 py-1 text-sm font-bold text-portal-ink">{t.tn_promoted}</span>
            <p className="text-xl font-semibold leading-tight">{headline.trim() || sel?.title || '…'}</p>
            <p className="text-sm text-white/85">{profile?.full_name} · {sel ? whenLabel(sel.starts_at, lang, labels) : ''}</p>
          </div>
          <div className="mt-6 flex items-end justify-between gap-4">
            <p className="max-w-[24ch] text-sm text-portal-muted">{t.bo_estimate_note}</p>
            <div className="text-right"><p className="font-display text-6xl font-extrabold leading-[0.85] tabular-nums" style={{ color: 'inherit' }}>{money(price)}</p><p className="mt-1.5 text-sm text-portal-muted">{t.bo_incl_vat} · {days} {t.bo_days_short}</p></div>
          </div>
          <button type="button" disabled={!!blockedReason || send.isPending} onClick={() => send.mutate()} className="mt-6 h-14 w-full bg-portal-copper font-display text-lg font-bold uppercase text-portal-on-copper transition-colors hover:bg-portal-copper-hover disabled:cursor-not-allowed disabled:opacity-45">{send.isPending ? t.coach_sending : t.bo_send}</button>
          <p className="mt-3 text-sm text-portal-muted">{t.bo_terms}</p>
        </section>
      </div>

      <section className="mt-14" aria-labelledby="h-mine">
        <h2 id="h-mine" className="mb-5 text-4xl">{t.bo_mine}</h2>
        {(data.data?.campaigns ?? []).length === 0 && <p className={`${box} p-6 text-lg`}>{t.bo_none}</p>}
        <div className="flex flex-col gap-2">
          {(data.data?.campaigns ?? []).map(c => (
            <article key={c.id} className={`${box} grid items-center gap-4 p-5 md:grid-cols-[minmax(0,1.6fr)_auto_repeat(3,minmax(70px,.5fr))_auto]`}>
              <div className="min-w-0"><p className="text-lg font-semibold leading-tight">{c.session_title}</p><p className="text-sm text-portal-muted">{c.placement === 'row' ? t.bo_row : t.bo_pick} · {c.starts_on} → {c.ends_on} · {money(c.price_eur)}{c.review_note ? ` · ${c.review_note}` : ''}</p></div>
              <span className={`inline-flex h-7 w-fit items-center px-2.5 text-sm font-bold ${statusTone[c.effective_status] ?? 'bg-portal-border'}`}>{statusLabel[c.effective_status] ?? c.effective_status}</span>
              {[[c.views, t.bo_views], [c.clicks, t.bo_clicks], [c.requests, t.bo_requests]].map(([n, l]) => <div key={String(l)}><p className="font-display text-3xl font-extrabold leading-none tabular-nums" style={{ color: 'inherit' }}>{n}</p><p className="mt-1 text-xs text-portal-muted">{l}</p></div>)}
              <div className="flex gap-2">
                {c.status === 'in_review' && <button type="button" onClick={() => campaignAction.mutate({ fn: 'withdraw_campaign', args: { p_id: c.id } })} className="h-10 bg-portal-bg px-4 text-sm font-semibold hover:bg-portal-border">{t.bo_withdraw}</button>}
                {(c.status === 'approved' || c.status === 'paused') && c.effective_status !== 'ended' && <button type="button" onClick={() => campaignAction.mutate({ fn: 'set_campaign_paused', args: { p_id: c.id, p_paused: c.status === 'approved' } })} className="h-10 bg-portal-bg px-4 text-sm font-semibold hover:bg-portal-border">{c.status === 'approved' ? t.bo_pause : t.bo_resume}</button>}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
