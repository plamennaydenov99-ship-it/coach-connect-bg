import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Check, Crown, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    monthly: 0,
    yearly: 0,
    features: ['Public profile', '3 enquiries/month', 'Basic analytics'],
    cta: 'Current plan',
  },
  {
    id: 'pro',
    name: 'Pro Coach',
    monthly: 29,
    yearly: 290,
    badge: 'Most popular',
    highlight: true,
    features: ['Unlimited enquiries', 'Verified badge', 'Platform discount opt-in', 'Advanced analytics', 'Priority placement'],
    cta: 'Upgrade to Pro',
  },
  {
    id: 'club',
    name: 'Club',
    monthly: 79,
    yearly: 790,
    features: ['Everything in Pro', 'Multi-coach roster', 'Club page', 'Programs & memberships', 'Dedicated success manager'],
    cta: 'Upgrade to Club',
  },
];

const Billing = () => {
  const [yearly, setYearly] = useState(false);

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-3xl">Subscription</h1>
        <p className="text-muted-foreground mt-1">Manage your plan and billing.</p>
      </div>

      <div className="surface p-5 flex items-center gap-3 border-gold/40 bg-gold/5">
        <Sparkles className="h-5 w-5 text-gold" />
        <p className="text-sm">
          You are on a <span className="font-semibold">free trial</span> — 47 days remaining.
        </p>
      </div>

      <div className="surface p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Current plan</p>
            <p className="font-display text-2xl mt-1 flex items-center gap-2">
              <Crown className="h-5 w-5 text-gold" /> Pro Coach
            </p>
            <p className="text-sm text-muted-foreground mt-1">€29/month · Renews 12 May 2026</p>
          </div>
          <Button variant="outline">Manage payment method</Button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 surface p-3 w-fit mx-auto">
        <Label htmlFor="billing-toggle" className={`text-sm ${!yearly ? 'font-semibold' : 'text-muted-foreground'}`}>Monthly</Label>
        <Switch id="billing-toggle" checked={yearly} onCheckedChange={setYearly} />
        <Label htmlFor="billing-toggle" className={`text-sm ${yearly ? 'font-semibold' : 'text-muted-foreground'}`}>
          Yearly <span className="text-gold text-xs ml-1">save 17%</span>
        </Label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map(p => (
          <div
            key={p.id}
            className={`surface p-6 flex flex-col relative ${
              p.highlight ? 'border-gold shadow-[0_0_0_1px_hsl(var(--gold))]' : ''
            }`}
          >
            {p.badge && (
              <span className="absolute -top-3 left-6 px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold">
                {p.badge}
              </span>
            )}
            <p className="font-display text-xl">{p.name}</p>
            <div className="mt-3">
              <span className="font-display text-4xl">
                €{yearly ? Math.round(p.yearly / 12) : p.monthly}
              </span>
              <span className="text-sm text-muted-foreground">/mo</span>
              {yearly && p.yearly > 0 && (
                <p className="text-xs text-muted-foreground mt-1">€{p.yearly} billed yearly</p>
              )}
            </div>
            <ul className="mt-5 space-y-2 flex-1">
              {p.features.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-gold shrink-0 mt-0.5" /> {f}
                </li>
              ))}
            </ul>
            <Button
              className="mt-6 w-full"
              variant={p.id === 'pro' ? 'default' : 'outline'}
              disabled={p.id === 'free'}
              onClick={() => toast.success(`${p.name} selected — checkout coming soon.`)}
            >
              {p.cta}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Billing;
