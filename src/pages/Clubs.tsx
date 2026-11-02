import { useMemo, useState } from 'react';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { PageHeader } from '@/components/layout/PageHeader';
import { ClubTile } from '@/components/cards/ClubTile';
import { useLanguage } from '@/context/LanguageContext';
import { useClubs } from '@/hooks/useClubs';
import { sportLabel } from '@/lib/trending';
import { chip } from '@/lib/ui';

export default function Clubs() {
  const { t, lang } = useLanguage();
  const q = useClubs();
  const [sport, setSport] = useState('all');
  const [district, setDistrict] = useState('all');
  const all = useMemo(() => q.data ?? [], [q.data]);

  const sportCounts = useMemo(() => {
    const m = new Map<string, number>();
    all.forEach(c => c.sports.forEach(s => m.set(s, (m.get(s) ?? 0) + 1)));
    return m;
  }, [all]);
  const sportChips = [...new Set([...sportCounts.keys(), ...(sport !== 'all' ? [sport] : [])])];
  const districts = useMemo(() => [...new Set(all.map(c => c.district).filter(Boolean) as string[])].sort(), [all]);
  const list = all.filter(c => (sport === 'all' || c.sports.includes(sport)) && (district === 'all' || c.district === district));
  const filtered = sport !== 'all' || district !== 'all';
  const reset = () => { setSport('all'); setDistrict('all'); };
  const count = q.isLoading ? t.coach_loading : list.length === 1 ? t.rd_cl_one : t.rd_cl_count.replace('{n}', String(list.length));

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicNav />
      <main className="flex-1">
        <PageHeader title={t.rd_clubs_title} sub={t.rd_clubs_sub} tone="blue">
          {(q.isLoading || all.length > 0) && <p className="font-display text-2xl font-extrabold uppercase" aria-live="polite">{count}</p>}
        </PageHeader>

        {all.length > 0 && (
          <div className="sticky top-16 z-30 bg-background md:top-20">
            <div className="container space-y-3 py-4">
              <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:px-0" role="group" aria-label={t.search_sport}>
                <button type="button" aria-pressed={sport === 'all'} onClick={() => setSport('all')} className={`h-14 shrink-0 px-5 font-display text-2xl font-extrabold uppercase transition-colors ${sport === 'all' ? 'bg-foreground text-background' : 'bg-background-secondary hover:bg-background-tertiary'}`}>{t.tn_sport_all}</button>
                {sportChips.map(s => (
                  <button key={s} type="button" aria-pressed={sport === s} onClick={() => setSport(s)} className={`h-14 shrink-0 px-5 font-display text-2xl font-extrabold uppercase transition-all duration-300 hover:-translate-y-0.5 ${sport === s ? 'bg-foreground text-background' : 'bg-background-secondary hover:bg-background-tertiary'}`}>
                    {sportLabel(s, lang)}<span className="ml-2 align-top text-sm font-semibold opacity-60">{sportCounts.get(s) ?? 0}</span>
                  </button>
                ))}
              </div>
              {districts.length > 1 && (
                <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t.rd_district_all}>
                  <button type="button" aria-pressed={district === 'all'} onClick={() => setDistrict('all')} className={chip(district === 'all')}>{t.rd_district_all}</button>
                  {districts.map(d => <button key={d} type="button" aria-pressed={district === d} onClick={() => setDistrict(d)} className={chip(district === d)}>{d}</button>)}
                  {filtered && <button type="button" onClick={reset} className="ml-3 text-base font-semibold text-primary underline-offset-4 hover:underline">{t.tn_reset}</button>}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="container py-8 md:py-12">
          {!q.isLoading && list.length === 0 ? (
            <div className="bg-background-secondary p-12 text-center">
              <p className="mx-auto max-w-[28ch] font-display text-4xl font-extrabold uppercase leading-[0.95]">{all.length === 0 ? t.rd_ev_none_sub : t.rd_cl_none}</p>
              {filtered && <button type="button" onClick={reset} className="mt-6 h-12 bg-primary px-6 font-display text-base font-bold uppercase text-primary-foreground hover:bg-primary-hover">{t.tn_reset}</button>}
            </div>
          ) : (
            <div key={`${sport}-${district}`} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {list.map((c, i) => <ClubTile key={c.key} club={c} index={i} />)}
            </div>
          )}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
