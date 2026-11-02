import { useMemo, useState } from 'react';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { PageHeader } from '@/components/layout/PageHeader';
import { EventPoster } from '@/components/cards/EventPoster';
import { useLanguage } from '@/context/LanguageContext';
import { useUpcomingEvents } from '@/hooks/useEvents';
import { EVENT_KINDS, monthEndIso, overlapsUntil, weekEndIso, type EventKind } from '@/lib/events';
import { sportLabel } from '@/lib/trending';
import { chip } from '@/lib/ui';

type When = 'all' | 'week' | 'month';

/** Events or camps, the same real data: sport strip, kind and date chips, a grid of posters. */
export function EventsBrowser({ mode }: { mode: 'events' | 'camps' }) {
  const { t, lang } = useLanguage();
  const q = useUpcomingEvents();
  const camps = mode === 'camps';
  const [sport, setSport] = useState('all');
  const [kind, setKind] = useState<'all' | EventKind>('all');
  const [when, setWhen] = useState<When>('all');

  const base = useMemo(() => (q.data ?? []).filter(e => (e.kind === 'camp') === camps), [q.data, camps]);
  const sportCounts = useMemo(() => {
    const m = new Map<string, number>();
    base.forEach(e => e.sport && m.set(e.sport, (m.get(e.sport) ?? 0) + 1));
    return m;
  }, [base]);
  const sportChips = [...new Set([...sportCounts.keys(), ...(sport !== 'all' ? [sport] : [])])];
  const kinds = useMemo(() => EVENT_KINDS.filter(k => k !== 'camp' && base.some(e => e.kind === k)), [base]);

  const list = useMemo(() => base.filter(e =>
    (sport === 'all' || e.sport === sport) &&
    (kind === 'all' || e.kind === kind) &&
    (when === 'all' || overlapsUntil(e, when === 'week' ? weekEndIso() : monthEndIso()))
  ), [base, sport, kind, when]);

  const filtered = sport !== 'all' || kind !== 'all' || when !== 'all';
  const reset = () => { setSport('all'); setKind('all'); setWhen('all'); };
  const count = q.isLoading ? t.coach_loading : list.length === 1 ? t.rd_ev_one : t.rd_ev_count.replace('{n}', String(list.length));
  const kindLabel = (k: string) => (t as Record<string, string>)[`rd_k_${k}`] ?? k;
  const whens: [When, string][] = [['all', t.rd_when_all], ['week', t.rd_when_week], ['month', t.rd_when_month]];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicNav />
      <main className="flex-1">
        <PageHeader title={camps ? t.camps_hero_title : t.events_page_title} sub={camps ? t.rd_camps_sub : t.rd_events_sub} tone={camps ? 'clay' : 'ink'}>
          {(q.isLoading || base.length > 0) && <p className="font-display text-2xl font-extrabold uppercase" aria-live="polite">{count}</p>}
        </PageHeader>

        {base.length > 0 && (
          <div className="sticky top-16 z-30 bg-background md:top-20">
            <div className="container space-y-3 py-4">
              {sportChips.length > 0 && (
                <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:px-0" role="group" aria-label={t.search_sport}>
                  <button type="button" aria-pressed={sport === 'all'} onClick={() => setSport('all')} className={`h-14 shrink-0 px-5 font-display text-2xl font-extrabold uppercase transition-colors ${sport === 'all' ? 'bg-foreground text-background' : 'bg-background-secondary hover:bg-background-tertiary'}`}>{t.tn_sport_all}</button>
                  {sportChips.map(s => (
                    <button key={s} type="button" aria-pressed={sport === s} onClick={() => setSport(s)} className={`h-14 shrink-0 px-5 font-display text-2xl font-extrabold uppercase transition-all duration-300 hover:-translate-y-0.5 ${sport === s ? 'bg-foreground text-background' : 'bg-background-secondary hover:bg-background-tertiary'}`}>
                      {sportLabel(s, lang)}<span className="ml-2 align-top text-sm font-semibold opacity-60">{sportCounts.get(s) ?? 0}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                {!camps && kinds.length > 1 && (
                  <div className="flex flex-wrap gap-1.5" role="group" aria-label={t.rd_k_all}>
                    <button type="button" aria-pressed={kind === 'all'} onClick={() => setKind('all')} className={chip(kind === 'all')}>{t.rd_k_all}</button>
                    {kinds.map(k => <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className={chip(kind === k)}>{kindLabel(k)}</button>)}
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5" role="group">{whens.map(([k, label]) => <button key={k} type="button" aria-pressed={when === k} onClick={() => setWhen(k)} className={chip(when === k)}>{label}</button>)}</div>
                {filtered && <button type="button" onClick={reset} className="text-base font-semibold text-primary underline-offset-4 hover:underline">{t.tn_reset}</button>}
              </div>
            </div>
          </div>
        )}

        <div className="container py-8 md:py-12">
          {!q.isLoading && base.length === 0 ? (
            <div className="bg-background-secondary p-12 text-center">
              <p className="mx-auto max-w-[28ch] font-display text-4xl font-extrabold uppercase leading-[0.95]">{t.rd_ev_none}</p>
              <p className="mx-auto mt-4 max-w-[42ch] text-foreground-muted">{t.rd_ev_none_sub}</p>
            </div>
          ) : !q.isLoading && list.length === 0 ? (
            <div className="bg-background-secondary p-12 text-center">
              <p className="mx-auto max-w-[32ch] text-2xl font-semibold">{t.tn_none_match}</p>
              <button type="button" onClick={reset} className="mt-6 h-12 bg-primary px-6 font-display text-base font-bold uppercase text-primary-foreground hover:bg-primary-hover">{t.tn_reset}</button>
            </div>
          ) : (
            <div key={`${sport}-${kind}-${when}`} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((e, i) => <EventPoster key={e.id} event={e} index={i} />)}
            </div>
          )}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
