import { useState, useMemo } from 'react';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { PageHeader } from '@/components/layout/PageHeader';
import { chip, lift } from '@/lib/ui';
import { Poster } from '@/components/cards/Poster';
import { CAMPS } from '@/lib/camps';
import { useLanguage } from '@/context/LanguageContext';

const SPORTS = ['All', 'Football', 'Tennis', 'Padel', 'Basketball', 'Running', 'Swimming', 'Cycling'];
const DURATIONS = [
  { label: 'Any', match: () => true },
  { label: 'Weekend (2-3 days)', match: (d: number) => d >= 2 && d <= 3 },
  { label: 'Week (5-7 days)', match: (d: number) => d >= 5 && d <= 7 },
  { label: '2 Weeks+', match: (d: number) => d >= 14 },
];

export default function Camps() {
  const { t } = useLanguage();
  const [sport, setSport] = useState('All');
  const [duration, setDuration] = useState(0);

  const filtered = useMemo(() => CAMPS.filter(c => {
    if (sport !== 'All' && c.sport !== sport) return false;
    if (!DURATIONS[duration].match(c.durationDays)) return false;
    return true;
  }), [sport, duration]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNav />

      <main className="flex-1">
        <PageHeader title={t.camps_hero_title} sub={t.camps_hero_sub} tone="blue">
          <p className="inline-block bg-[#F3EDE2]/15 px-3 py-2 text-sm">{t.camps_demo_note}</p>
        </PageHeader>

        <section className="bg-background-secondary py-6">
          <div className="container flex flex-col gap-4">
            <div className="flex flex-wrap gap-1.5">
              {SPORTS.map(s => (
                <button
                  key={s}
                  onClick={() => setSport(s)}
                  className={chip(sport === s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map((d, i) => (
                  <button
                    key={d.label}
                    onClick={() => setDuration(i)}
                    className={chip(duration === i)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="container py-12 md:py-16">
          {filtered.length ? (
            <div key={`${sport}-${duration}`} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((c, i) => (
                <Poster key={c.id} index={i} to={`/camps/${c.id}`} cta={t.tn_camp_view} big={c.price} small={c.dates}
                  chips={[c.sport, c.duration]} title={c.name} place={`${c.city} · ${c.coach}`}
                  foot={<div className="w-40"><div className="h-2.5 bg-[#F3EDE2]/30"><div className="h-full bg-[#F3EDE2]" style={{ width: `${Math.max(8, Math.min(100, 100 - c.spotsLeft * 5))}%` }} /></div><p className="mt-1.5 text-sm tabular-nums">{c.spotsLeft} {t.spots_left}</p></div>} />
              ))}
            </div>
          ) : (
            <div className="bg-background-secondary p-12 text-center">
              <p className="text-foreground-muted font-body">No camps match your filters.</p>
            </div>
          )}
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
