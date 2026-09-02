import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Check, Crown, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';


const makePlans = (t: Record<string, string>) => [
  {
    id: 'free',
    name: t.billing_plan_free,
    monthly: 0,
    yearly: 0,
    features: [t.billing_f_public_profile, t.billing_f_3_enquiries, t.billing_f_basic_analytics],
    cta: t.billing_cta_current,
  },
  {
    id: 'pro',
    name: t.billing_pro_coach,
    monthly: 29,
    yearly: 290,
    badge: t.billing_badge_popular,
    highlight: true,
    features: [t.billing_f_unlimited, t.billing_f_verified, t.billing_f_discount, t.billing_f_advanced, t.billing_f_priority],
    cta: t.billing_cta_pro,
  },
  {
    id: 'club',
    name: t.billing_plan_club,
    monthly: 79,
    yearly: 790,
    features: [t.billing_f_everything_pro, t.billing_f_roster, t.billing_f_club_page, t.billing_f_programs, t.billing_f_manager],
    cta: t.billing_cta_club,
  },
];

const Billing = () => {
  const { t } = useLanguage();
  const [yearly, setYearly] = useState(false);

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-3xl">{t.billing_title}</h1>
        <p className="text-muted-foreground mt-1">{t.billing_sub}</p>
      </div>

      <div className="surface p-5 flex items-center gap-3 border-gold/40 bg-gold/5">
        <Sparkles className="h-5 w-5 text-gold" />
        <p className="text-sm">
          {t.billing_trial_a} <span className="font-semibold">{t.billing_trial_b}</span> {t.billing_trial_c}
        </p>
      </div>

      <div className="surface p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{t.billing_current_plan}</p>
            <p className="font-display text-2xl mt-1 flex items-center gap-2">
              <Crown className="h-5 w-5 text-gold" /> {t.billing_pro_coach}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{t.billing_renews}</p>
          </div>
          <Button variant="outline">{t.billing_manage_payment}</Button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 surface p-3 w-fit mx-auto">
        <Label htmlFor="billing-toggle" className={`text-sm ${!yearly ? 'font-semibold' : 'text-muted-foreground'}`}>{t.billing_monthly}</Label>
        <Switch id="billing-toggle" checked={yearly} onCheckedChange={setYearly} />
        <Label htmlFor="billing-toggle" className={`text-sm ${yearly ? 'font-semibold' : 'text-muted-foreground'}`}>
          {t.billing_yearly} <span className="text-gold text-xs ml-1">{t.billing_save17}</span>
        </Label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {makePlans(t).map(p => (
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
              <span className="text-sm text-muted-foreground">{t.billing_per_mo}</span>
              {yearly && p.yearly > 0 && (
                <p className="text-xs text-muted-foreground mt-1">€{p.yearly} {t.billing_billed_yearly}</p>
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
              onClick={() => toast.success(`${p.name} ${t.billing_selected_toast}`)}
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
