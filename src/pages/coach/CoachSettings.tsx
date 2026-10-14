import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Switch } from '@/components/ui/switch';
import { useSaveBillingSettings } from '@/hooks/coach/usePaymentRequests';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage, type Lang } from '@/context/LanguageContext';
import { portalBtnPrimary, portalInput, portalLabel } from '@/components/coach/clients/shared';

export const TIMEZONES = [
  { value: 'Europe/Sofia', label: 'Sofia' },
  { value: 'Europe/Paris', label: 'Nice' },
  { value: 'Europe/Monaco', label: 'Monaco' },
] as const;

const LANGS: { value: Lang; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'bg', label: 'Български' },
  { value: 'fr', label: 'Français' },
];

/** Placeholder until a real support address is provided. */
const CONTACT_EMAIL = '[CONTACT EMAIL]';

const card = 'bg-portal-card border border-portal-border rounded-[4px] p-6 space-y-4';
const h2 = 'font-display uppercase tracking-[0.1em] text-lg text-portal-ink';

export default function CoachSettings() {
  const { t, lang, setLang } = useLanguage();
  const { user, profile, refreshProfile } = useAuth();
  const qc = useQueryClient();
  const [tz, setTz] = useState<string>((profile as any)?.timezone || 'Europe/Sofia');
  const [saving, setSaving] = useState(false);

  const billingKey = ['coach', user?.id, 'billing_settings'];
  const { data: billing } = useQuery({
    queryKey: billingKey,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('billing_settings').select('*').eq('owner_id', user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const setChargeNoShows = async (on: boolean) => {
    if (!user) return;
    const { error } = await supabase.from('billing_settings').upsert({ owner_id: user.id, charge_no_shows: on }, { onConflict: 'owner_id' });
    if (error) { toast.error(t.crm_error); return; }
    qc.invalidateQueries({ queryKey: billingKey });
    toast.success(t.dashsettings_saved);
  };

  const saveTz = async () => {
    if (!user || !TIMEZONES.some((z) => z.value === tz)) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ timezone: tz }).eq('id', user.id);
    setSaving(false);
    if (error) { toast.error(t.crm_error); return; }
    await refreshProfile();
    qc.invalidateQueries({ queryKey: ['coach', user.id] });
    toast.success(t.dashsettings_saved);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display uppercase text-3xl tracking-[0.06em] text-portal-ink">{t.dashsettings_title}</h1>
        <p className="text-portal-muted-strong mt-1">{t.cset_sub}</p>
      </div>

      <section className={card}>
        <h2 className={h2}>{t.dashsettings_account}</h2>
        <label className="grid gap-1.5"><span className={portalLabel}>{t.dashsettings_email}</span>
          <input type="email" value={user?.email ?? ''} readOnly className={`${portalInput} bg-portal-bg`} /></label>
      </section>

      <section className={card}>
        <h2 className={h2}>{t.cset_timezone}</h2>
        <p className="text-sm text-portal-muted">{t.cset_timezone_sub}</p>
        <div className="flex flex-wrap gap-2">
          <select value={tz} onChange={(e) => setTz(e.target.value)} className={`${portalInput} w-60`} aria-label={t.cset_timezone}>
            {TIMEZONES.map((z) => <option key={z.value} value={z.value}>{z.label} ({z.value})</option>)}
          </select>
          <button onClick={saveTz} disabled={saving} className={portalBtnPrimary}>{t.dashsettings_save}</button>
        </div>
      </section>

      <section className={card}>
        <h2 className={h2}>{t.bill_section}</h2>
        <label className="flex items-center justify-between gap-4">
          <span>
            <span className="block text-sm text-portal-ink">{t.set_charge_noshow}</span>
            <span className="block text-sm text-portal-muted">{t.set_charge_noshow_sub}</span>
          </span>
          <Switch checked={!!billing?.charge_no_shows} onCheckedChange={setChargeNoShows} aria-label={t.set_charge_noshow} />
        </label>
        <BillingDetails key={billing ? 'loaded' : 'empty'} initial={billing ?? null} />
      </section>

      <section className={card}>
        <h2 className={h2}>{t.portal_language}</h2>
        <div className="flex gap-2">
          {LANGS.map((l) => (
            <button key={l.value} onClick={() => setLang(l.value)}
              className={`h-10 px-4 rounded-[4px] border text-sm ${lang === l.value ? 'bg-portal-selected border-portal-selected-border text-portal-ink' : 'border-portal-border text-portal-muted-strong hover:text-portal-ink'}`}>
              {l.label}
            </button>
          ))}
        </div>
      </section>

      <section className={card}>
        <h2 className={h2}>{t.dashsettings_danger}</h2>
        <p className="text-sm text-portal-muted">{t.cset_delete_contact.replace('{email}', CONTACT_EMAIL)}</p>
      </section>
    </div>
  );
}

function BillingDetails({ initial }: { initial: { payment_link: string | null; iban: string | null; default_due_days: number; request_prefix: string } | null }) {
  const { t } = useLanguage();
  const save = useSaveBillingSettings();
  const [link, setLink] = useState(initial?.payment_link ?? '');
  const [iban, setIban] = useState(initial?.iban ?? '');
  const [days, setDays] = useState(String(initial?.default_due_days ?? 14));
  const [prefix, setPrefix] = useState(initial?.request_prefix ?? 'LK');
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const l = link.trim(), d = Number(days), pre = prefix.trim().toUpperCase();
    if (l && (!/^https:\/\//.test(l) || l.length > 300)) return toast.error(t.set_payment_link_error);
    if (!Number.isInteger(d) || d < 0 || d > 90) return toast.error(t.set_due_days_error);
    if (!/^[A-Z0-9]{1,8}$/.test(pre)) return toast.error(t.set_prefix_error);
    save.mutate(
      { payment_link: l || null, iban: iban.replace(/\s+/g, ' ').trim().slice(0, 40) || null, default_due_days: d, request_prefix: pre },
      { onSuccess: () => toast.success(t.dashsettings_saved), onError: () => toast.error(t.crm_error) },
    );
  };
  return (
    <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3 pt-4 border-t border-portal-border">
      <label className="grid gap-1.5 sm:col-span-2"><span className={portalLabel}>{t.set_payment_link}</span>
        <input type="url" value={link} maxLength={300} placeholder="https://" onChange={(e) => setLink(e.target.value)} className={portalInput} /></label>
      <label className="grid gap-1.5 sm:col-span-2"><span className={portalLabel}>IBAN</span>
        <input value={iban} maxLength={40} onChange={(e) => setIban(e.target.value)} className={`${portalInput} font-mono`} /></label>
      <label className="grid gap-1.5"><span className={portalLabel}>{t.set_due_days}</span>
        <input type="number" min={0} max={90} step={1} value={days} onChange={(e) => setDays(e.target.value)} className={portalInput} /></label>
      <label className="grid gap-1.5"><span className={portalLabel}>{t.set_request_prefix}</span>
        <input value={prefix} maxLength={8} onChange={(e) => setPrefix(e.target.value.toUpperCase())} className={`${portalInput} font-mono`} /></label>
      <p className="text-xs text-portal-muted sm:col-span-2">{t.set_billing_details_sub}</p>
      <div className="sm:col-span-2"><button type="submit" disabled={save.isPending} className={portalBtnPrimary}>{t.dashsettings_save}</button></div>
    </form>
  );
}
