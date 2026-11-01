import { useState, useMemo } from 'react';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { CampCard } from '@/components/camps/CampCard';
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
        <section className="border-b border-border bg-background py-16 md:py-20">
          <div className="container">
            <h1 className="font-display text-5xl md:text-6xl text-foreground">{t.camps_hero_title}</h1>
            <p className="mt-4 max-w-2xl text-[16px] text-foreground-muted font-body normal-case">{t.camps_hero_sub}</p>
            <p className="mt-4 text-[13px] text-foreground-muted font-body normal-case border border-border bg-background-secondary/60 px-3 py-2 inline-block rounded-sm">
              {t.camps_demo_note}
            </p>

          </div>
        </section>

        <section className="border-b border-border bg-background-secondary/40 py-6">
          <div className="container flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {SPORTS.map(s => (
                <button
                  key={s}
                  onClick={() => setSport(s)}
                  className={`px-3 py-1.5 border font-display uppercase tracking-[0.12em] text-[12px] rounded-sm transition-colors ${
                    sport === s
                      ? 'border-copper text-gold'
                      : 'border-border text-foreground-muted hover:text-foreground'
                  }`}
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
                    className={`px-3 py-1.5 border font-display uppercase tracking-[0.12em] text-[11px] rounded-sm transition-colors ${
                      duration === i
                        ? 'border-copper text-gold'
                        : 'border-border text-foreground-muted hover:text-foreground'
                    }`}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(c => <CampCard key={c.id} camp={c} />)}
            </div>
          ) : (
            <div className="border border-border bg-card p-12 text-center">
              <p className="text-foreground-muted font-body">No camps match your filters.</p>
            </div>
          )}
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
