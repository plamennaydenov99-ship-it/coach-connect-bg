import { useState } from 'react';
import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SPORTS, CITIES } from '@/lib/mockData';
import { useLanguage } from '@/context/LanguageContext';

export interface MatchAnswers {
  sport?: string;
  level?: string;
  city?: string;
  goal?: string;
}

interface Props {
  onMatch?: (answers: MatchAnswers) => void;
}

export function MatchingSection({ onMatch }: Props = {}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<MatchAnswers>({});
  const [matching, setMatching] = useState(false);
  const { lang, t } = useLanguage();

  const LEVELS = [
    { key: 'Beginner', label: t.level_beginner },
    { key: 'Intermediate', label: t.level_intermediate },
    { key: 'Advanced', label: t.level_advanced },
    { key: 'Elite', label: t.level_elite },
  ];
  const GOALS = [
    { key: 'Get fit', label: t.goal_fit },
    { key: 'Compete', label: t.goal_compete },
    { key: 'Learn basics', label: t.goal_learn },
    { key: 'Train consistently', label: t.goal_consistent },
    { key: 'Recover from injury', label: t.goal_recover },
  ];
  const stepLabels = [t.step_sport_label, t.step_level_label, t.step_location_label, t.step_goal_label];

  const canNext =
    (step === 0 && answers.sport) ||
    (step === 1 && answers.level) ||
    (step === 2 && answers.city && answers.city.trim().length > 0) ||
    (step === 3 && answers.goal);

  const next = () => {
    if (step < 3) setStep(step + 1);
    else submit();
  };

  const submit = () => {
    setMatching(true);
    setTimeout(() => {
      setMatching(false);
      onMatch?.(answers);
      setTimeout(() => {
        document.getElementById('coach-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }, 1200);
  };

  const activeBtn = 'bg-foreground text-background';
  const idleBtn = 'bg-background text-foreground hover:bg-card';

  return (
    <section
      id="matching-section"
      className="relative scroll-mt-20 overflow-hidden bg-background-secondary"
    >
      <div className="container py-20 md:py-28 max-w-5xl">
        <div className="text-center mb-12">
          <h1 style={{ fontSize: 'clamp(48px, 7vw, 104px)' }}>
            {t.match_heading_a}<br />{t.match_heading_b}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-foreground-muted md:text-xl">
            {t.match_sub}
          </p>
        </div>

        <div className="max-w-3xl mx-auto mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-base font-semibold">{t.step_of} {step + 1} {t.of} 4</span>
            <span className="text-base text-foreground-muted">{stepLabels[step]}</span>
          </div>
          <div className="relative h-2.5 w-full overflow-hidden bg-background">
            <div
              className="absolute inset-y-0 left-0 bg-primary transition-all duration-500"
              style={{ width: `${((step + 1) / 4) * 100}%` }}
            />
          </div>
        </div>

        <div className="max-w-3xl mx-auto min-h-[280px]">
          {matching ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-gold" />
              <p className="font-display text-xl font-bold uppercase text-foreground-muted">
                {t.matching}
              </p>
              <div className="mt-4 w-full max-w-xl space-y-2">
                {[0, 1, 2].map(i => (
                  <div key={i} className="h-16 animate-pulse bg-background" />
                ))}
              </div>
            </div>
          ) : (
            <>
              {step === 0 && (
                <div>
                  <h3 className="mb-5 text-4xl">{t.step_sport}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {SPORTS.map(s => {
                      const active = answers.sport === s.slug;
                      const label = lang === 'bg' && s.labelBg ? s.labelBg : s.label;
                      return (
                        <button
                          key={s.slug}
                          onClick={() => setAnswers(a => ({ ...a, sport: s.slug }))}
                          className={`px-4 py-3 text-base font-display font-bold uppercase transition-colors text-left ${active ? activeBtn : idleBtn}`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div>
                  <h3 className="mb-5 text-4xl">{t.step_level}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {LEVELS.map(l => {
                      const active = answers.level === l.key;
                      return (
                        <button
                          key={l.key}
                          onClick={() => setAnswers(a => ({ ...a, level: l.key }))}
                          className={`px-4 py-4 text-base font-display font-bold uppercase transition-colors ${active ? activeBtn : idleBtn}`}
                        >
                          {l.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h3 className="mb-5 text-4xl">{t.step_location}</h3>
                  <Input
                    autoFocus
                    value={answers.city ?? ''}
                    onChange={e => setAnswers(a => ({ ...a, city: e.target.value }))}
                    placeholder={t.city_placeholder}
                    className="h-14 border-0 bg-background text-base"
                    onKeyDown={e => e.key === 'Enter' && canNext && next()}
                  />
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="mr-2 self-center text-base text-foreground-muted">{t.suggestions}</span>
                    {CITIES.map(c => (
                      <button
                        key={c}
                        onClick={() => setAnswers(a => ({ ...a, city: c }))}
                        className="h-11 px-3 text-base font-medium bg-background text-foreground hover:bg-card transition-colors"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h3 className="mb-5 text-4xl">{t.step_goal}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {GOALS.map(g => {
                      const active = answers.goal === g.key;
                      return (
                        <button
                          key={g.key}
                          onClick={() => setAnswers(a => ({ ...a, goal: g.key }))}
                          className={`px-4 py-4 text-base font-display font-bold uppercase text-left transition-colors ${active ? activeBtn : idleBtn}`}
                        >
                          {g.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {!matching && (
          <div className="max-w-3xl mx-auto mt-8 flex items-center justify-between">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep(s => Math.max(0, s - 1))}>
              <ArrowLeft className="h-4 w-4 mr-2" /> {t.back}
            </Button>
            <Button onClick={next} disabled={!canNext} size="lg">
              {step === 3 ? t.match_cta : t.next} <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
