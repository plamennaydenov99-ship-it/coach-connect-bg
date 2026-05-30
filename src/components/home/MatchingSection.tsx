import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const STEPS = [
  { key: 'sport', label: 'What sport?', placeholder: 'e.g. Tennis, Padel, Boxing…' },
  { key: 'level', label: 'Your skill level?', placeholder: 'Beginner · Intermediate · Advanced' },
  { key: 'location', label: 'Where are you based?', placeholder: 'City or neighborhood' },
  { key: 'goals', label: 'Your goals?', placeholder: 'e.g. Compete, get fit, learn fundamentals…' },
];

export function MatchingSection() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  const current = STEPS[step];

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else setDone(true);
    // AI matching logic to be integrated — for now this is a static multi-step form.
  };

  const reset = () => {
    setStep(0); setAnswers({}); setDone(false);
  };

  return (
    <section
      className="relative border-y border-border bg-background-secondary overflow-hidden"
      style={{
        backgroundImage:
          'repeating-linear-gradient(45deg, hsl(0 0% 100% / 0.02) 0 1px, transparent 1px 14px)',
      }}
    >
      <div className="container py-24 md:py-32 max-w-4xl text-center">
        <span className="label-eyebrow text-primary">AI · Smart Match</span>
        <h2 className="mt-5 font-display text-5xl md:text-7xl lg:text-8xl text-foreground">
          Find Your<br />Perfect Match
        </h2>
        <p className="mt-6 text-foreground-muted max-w-2xl mx-auto text-base md:text-lg font-body">
          Answer a few questions and our AI will match you with the ideal coach
          based on your sport, level, location and goals.
        </p>
        <Button
          onClick={() => { reset(); setOpen(true); }}
          size="lg"
          className="mt-10"
        >
          Start Matching <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-w-lg rounded-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl tracking-wide">
              {done ? 'You’re all set' : 'Smart Match'}
            </DialogTitle>
          </DialogHeader>

          {!done ? (
            <div className="space-y-5">
              <div className="h-px w-full bg-border relative overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-primary transition-all"
                  style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                />
              </div>
              <div>
                <label className="label-eyebrow text-foreground-muted">
                  Step {step + 1} of {STEPS.length}
                </label>
                <h3 className="mt-2 font-display text-2xl text-foreground">{current.label}</h3>
                <Input
                  autoFocus
                  value={answers[current.key] ?? ''}
                  onChange={e => setAnswers({ ...answers, [current.key]: e.target.value })}
                  placeholder={current.placeholder}
                  className="mt-4 h-12 bg-background-secondary border-border rounded-sm"
                  onKeyDown={e => e.key === 'Enter' && next()}
                />
              </div>
              <div className="flex justify-between gap-2">
                <Button
                  variant="ghost"
                  disabled={step === 0}
                  onClick={() => setStep(s => Math.max(0, s - 1))}
                >
                  Back
                </Button>
                <Button onClick={next}>
                  {step === STEPS.length - 1 ? 'See matches' : 'Next'} <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto h-14 w-14 flex items-center justify-center bg-foreground text-background rounded-sm">
                <Check className="h-7 w-7" />
              </div>
              <p className="text-foreground-muted font-body">
                We'll surface your top coach matches as soon as the AI engine
                comes online. In the meantime, browse the directory.
              </p>
              <Button asChild>
                <a href="/search">Browse coaches</a>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
