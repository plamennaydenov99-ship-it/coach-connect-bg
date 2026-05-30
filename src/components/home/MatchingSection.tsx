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
  onMatch: (answers: MatchAnswers) => void;
}

export function MatchingSection({ onMatch }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<MatchAnswers>({});
  const [matching, setMatching] = useState(false);

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
    // TODO: Replace with Claude AI matching API call in Phase 2
    setMatching(true);
    setTimeout(() => {
      setMatching(false);
      onMatch(answers);
      setTimeout(() => {
        document.getElementById('coach-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }, 1200);
  };

  return (
    <section
      className="relative border-b border-border bg-background-secondary overflow-hidden"
      style={{
        backgroundImage:
          'repeating-linear-gradient(45deg, hsl(0 0% 100% / 0.02) 0 1px, transparent 1px 14px)',
      }}
    >
      <div className="container py-20 md:py-28 max-w-5xl">
        <div className="text-center mb-12">
          <span className="label-eyebrow text-primary">AI · Smart Match</span>
          <h1 className="mt-5 font-display text-5xl md:text-7xl text-foreground">
            Find Your<br />Perfect Match
          </h1>
          <p className="mt-6 text-foreground-muted max-w-2xl mx-auto text-base md:text-lg font-body">
            Answer 4 quick questions — our AI finds your ideal coach based on
            sport, level, location and goals.
          </p>
        </div>

        {/* Progress */}
        <div className="max-w-3xl mx-auto mb-6">
          <div className="flex justify-between mb-2">
            <span className="label-eyebrow text-foreground-muted">Step {step + 1} of 4</span>
            <span className="label-eyebrow text-foreground-subtle">
              {['Sport', 'Level', 'Location', 'Goal'][step]}
            </span>
          </div>
          <div className="h-px w-full bg-border relative overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-primary transition-all duration-500"
              style={{ width: `${((step + 1) / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step body */}
        <div className="max-w-3xl mx-auto min-h-[280px]">
          {matching ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="font-display uppercase tracking-[0.15em] text-foreground-muted text-sm">
                We're matching you…
              </p>
              <div className="mt-4 w-full max-w-xl space-y-2">
                {[0, 1, 2].map(i => (
                  <div key={i} className="h-16 bg-background-tertiary border border-border animate-pulse" />
                ))}
              </div>
            </div>
          ) : (
            <>
              {step === 0 && (
                <div>
                  <h3 className="font-display text-2xl text-foreground mb-5">What sport?</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {SPORTS.map(s => {
                      const active = answers.sport === s.slug;
                      return (
                        <button
                          key={s.slug}
                          onClick={() => setAnswers(a => ({ ...a, sport: s.slug }))}
                          className={`px-4 py-3 border text-sm font-display uppercase tracking-[0.1em] transition-colors text-left ${
                            active
                              ? 'bg-background-tertiary border-primary text-foreground'
                              : 'bg-background-tertiary border-border text-foreground-muted hover:border-border-hover hover:text-foreground'
                          }`}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div>
                  <h3 className="font-display text-2xl text-foreground mb-5">What's your level?</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {LEVELS.map(l => {
                      const active = answers.level === l;
                      return (
                        <button
                          key={l}
                          onClick={() => setAnswers(a => ({ ...a, level: l }))}
                          className={`px-4 py-4 border text-sm font-display uppercase tracking-[0.1em] transition-colors ${
                            active
                              ? 'bg-background-tertiary border-primary text-foreground'
                              : 'bg-background-tertiary border-border text-foreground-muted hover:border-border-hover hover:text-foreground'
                          }`}
                        >
                          {l}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h3 className="font-display text-2xl text-foreground mb-5">Where are you based?</h3>
                  <Input
                    autoFocus
                    value={answers.city ?? ''}
                    onChange={e => setAnswers(a => ({ ...a, city: e.target.value }))}
                    placeholder="City or neighborhood"
                    className="h-14 bg-background-tertiary border-border rounded-sm text-base"
                    onKeyDown={e => e.key === 'Enter' && canNext && next()}
                  />
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="label-eyebrow text-foreground-subtle mr-2 self-center">Suggestions:</span>
                    {CITIES.map(c => (
                      <button
                        key={c}
                        onClick={() => setAnswers(a => ({ ...a, city: c }))}
                        className="px-3 py-1.5 border border-border text-xs font-display uppercase tracking-[0.1em] text-foreground-muted hover:border-border-hover hover:text-foreground transition-colors"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h3 className="font-display text-2xl text-foreground mb-5">What's your main goal?</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {GOALS.map(g => {
                      const active = answers.goal === g;
                      return (
                        <button
                          key={g}
                          onClick={() => setAnswers(a => ({ ...a, goal: g }))}
                          className={`px-4 py-4 border text-sm font-display uppercase tracking-[0.1em] text-left transition-colors ${
                            active
                              ? 'bg-background-tertiary border-primary text-foreground'
                              : 'bg-background-tertiary border-border text-foreground-muted hover:border-border-hover hover:text-foreground'
                          }`}
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Controls */}
        {!matching && (
          <div className="max-w-3xl mx-auto mt-8 flex items-center justify-between">
            <Button
              variant="ghost"
              disabled={step === 0}
              onClick={() => setStep(s => Math.max(0, s - 1))}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <Button onClick={next} disabled={!canNext} size="lg" className="tracking-[0.1em]">
              {step === 3 ? 'Find My Coaches' : 'Next'} <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
