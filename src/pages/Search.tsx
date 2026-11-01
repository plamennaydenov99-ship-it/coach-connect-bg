import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { PageHeader } from '@/components/layout/PageHeader';
import { CoachTile, type CoachTileData } from '@/components/cards/CoachTile';
import { SPORTS } from '@/lib/mockData';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/context/LanguageContext';
import { chip } from '@/lib/ui';

type SortKey = 'relevance' | 'price' | 'newest';
type PriceBand = 'any' | 'low' | 'mid' | 'high';

interface CoachRow {
  id: string;
  sport: string | null;
  sports: string[] | null;
  price_per_session: number | null;
  verified: boolean;
  created_at: string;
  profiles: { full_name: string | null; avatar_url: string | null; city: string | null } | null;
}

const BANDS: Record<PriceBand, (p: number) => boolean> = {
  any: () => true,
  low: p => p < 30,
  mid: p => p >= 30 && p <= 60,
  high: p => p > 60,
};
const sportsOf = (c: CoachRow) => (c.sports?.length ? c.sports : c.sport ? [c.sport] : []).map(s => s.toLowerCase());

const Search = () => {
  const { t, lang } = useLanguage();
  const [params] = useSearchParams();
  const [sport, setSport] = useState((params.get('sport') ?? 'all').toLowerCase());
  const [band, setBand] = useState<PriceBand>('any');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>('relevance');
  const [coaches, setCoaches] = useState<CoachRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('coach_profiles')
        .select('id, sport, sports, price_per_session, verified, created_at, profiles!coach_profiles_id_fkey(full_name, avatar_url, city)')
        .eq('application_status', 'approved');
      if (!error && data) setCoaches(data as unknown as CoachRow[]);
      setLoading(false);
    })();
  }, []);

  // Sports that have at least one coach, with how many. The selected sport always stays visible.
  const sportCounts = useMemo(() => {
    const m = new Map<string, number>();
    coaches.forEach(c => sportsOf(c).forEach(s => m.set(s, (m.get(s) ?? 0) + 1)));
    return m;
  }, [coaches]);
  const sportLabel = (slug: string) => { const s = SPORTS.find(x => x.slug === slug); return s ? (lang === 'bg' ? s.labelBg : s.label) : slug.charAt(0).toUpperCase() + slug.slice(1); };
  const sportChips = [...new Set([...sportCounts.keys(), ...(sport !== 'all' ? [sport] : [])])];

  const results = useMemo(() => {
    let list = coaches.filter(c => (sport === 'all' || sportsOf(c).includes(sport)) && BANDS[band](c.price_per_session ?? 0) && (!verifiedOnly || c.verified));
    if (sort === 'price') list = [...list].sort((a, b) => (a.price_per_session ?? 0) - (b.price_per_session ?? 0));
    if (sort === 'newest') list = [...list].sort((a, b) => b.created_at.localeCompare(a.created_at));
    return list;
  }, [coaches, sport, band, verifiedOnly, sort]);

  const tiles: CoachTileData[] = results.map(c => ({
    id: c.id, name: c.profiles?.full_name || 'Coach', avatar: c.profiles?.avatar_url ?? null, city: c.profiles?.city ?? null,
    sports: sportsOf(c), price: c.price_per_session ?? 0, verified: c.verified,
  }));
  const reset = () => { setSport('all'); setBand('any'); setVerifiedOnly(false); };
  const filtered = sport !== 'all' || band !== 'any' || verifiedOnly;
  const count = loading ? t.coach_loading : results.length === 1 ? t.tn_coach_one : t.tn_coach_count.replace('{n}', String(results.length));

  const bands: [PriceBand, string][] = [['any', t.tn_price_any], ['low', t.tn_price_low], ['mid', t.tn_price_mid], ['high', t.tn_price_high]];
  const sorts: [SortKey, string][] = [['relevance', t.tn_sort_relevance], ['price', t.tn_sort_price], ['newest', t.tn_sort_newest]];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicNav />
      <main className="flex-1">
        <PageHeader title={t.search_coaches} sub={count} tone="blue" />

        <div className="sticky top-16 z-30 bg-background md:top-20">
          <div className="container space-y-3 py-4">
            <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:px-0" role="group" aria-label={t.search_sport}>
              <button type="button" aria-pressed={sport === 'all'} onClick={() => setSport('all')} className={`h-14 shrink-0 px-5 font-display text-2xl font-extrabold uppercase transition-colors ${sport === 'all' ? 'bg-foreground text-background' : 'bg-background-secondary hover:bg-background-tertiary'}`}>{t.tn_sport_all}</button>
              {sportChips.map(s => (
                <button key={s} type="button" aria-pressed={sport === s} onClick={() => setSport(s)} className={`h-14 shrink-0 px-5 font-display text-2xl font-extrabold uppercase transition-all duration-300 hover:-translate-y-0.5 ${sport === s ? 'bg-foreground text-background' : 'bg-background-secondary hover:bg-background-tertiary'}`}>
                  {sportLabel(s)}<span className="ml-2 align-top text-sm font-semibold opacity-60">{sportCounts.get(s) ?? 0}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="flex flex-wrap gap-1.5" role="group" aria-label={t.search_price_range}>{bands.map(([k, label]) => <button key={k} type="button" aria-pressed={band === k} onClick={() => setBand(k)} className={chip(band === k)}>{label}</button>)}</div>
              <button type="button" aria-pressed={verifiedOnly} onClick={() => setVerifiedOnly(!verifiedOnly)} className={chip(verifiedOnly)}>{t.tn_verified_only}</button>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label={t.tn_sort}>{sorts.map(([k, label]) => <button key={k} type="button" aria-pressed={sort === k} onClick={() => setSort(k)} className={chip(sort === k)}>{label}</button>)}</div>
              {filtered && <button type="button" onClick={reset} className="text-base font-semibold text-primary underline-offset-4 hover:underline">{t.tn_reset}</button>}
            </div>
          </div>
        </div>

        <div className="container py-8 md:py-12">
          {!loading && tiles.length === 0 ? (
            <div className="bg-background-secondary p-12 text-center">
              <p className="mx-auto max-w-[32ch] text-2xl font-semibold">{t.tn_none_match}</p>
              {filtered && <button type="button" onClick={reset} className="mt-6 h-12 bg-primary px-6 font-display text-base font-bold uppercase text-primary-foreground hover:bg-primary-hover">{t.tn_reset}</button>}
            </div>
          ) : (
            <div key={`${sport}-${band}-${verifiedOnly}-${sort}`} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {tiles.map((c, i) => <CoachTile key={c.id} coach={c} index={i} />)}
            </div>
          )}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
};

export default Search;
