import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import { portalBtnPrimary, portalInput, portalLabel } from '@/components/coach/clients/shared';

export const TIMEZONES = [
  { value: 'Europe/Sofia', label: 'Sofia' },
  { value: 'Europe/Paris', label: 'Nice' },
  { value: 'Europe/Monaco', label: 'Monaco' },
] as const;

const card = 'bg-portal-card border border-portal-border rounded-[4px] p-6 space-y-4';
const h2 = 'font-display uppercase tracking-[0.1em] text-lg text-portal-ink';

/** Portal version of the dashboard Settings page (same fields) + time zone. */
export default function CoachSettings() {
  const { t } = useLanguage();
  const { user, profile, refreshProfile } = useAuth() as any;
  const qc = useQueryClient();
  const [tz, setTz] = useState<string>(profile?.timezone || 'Europe/Sofia');
  const [saving, setSaving] = useState(false);

  const saveTz = async () => {
    if (!TIMEZONES.some((z) => z.value === tz)) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ timezone: tz }).eq('id', user.id);
    setSaving(false);
    if (error) { toast.error(t.crm_error); return; }
    await refreshProfile?.();
    qc.invalidateQueries({ queryKey: ['coach', user.id] });
    toast.success(t.dashsettings_saved);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display uppercase text-3xl tracking-[0.06em] text-portal-ink">{t.dashsettings_title}</h1>
        <p className="text-portal-muted-strong mt-1">{t.dashsettings_sub}</p>
      </div>

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
        <h2 className={h2}>{t.dashsettings_account}</h2>
        <label className="grid gap-1.5"><span className={portalLabel}>{t.dashsettings_email}</span>
          <input type="email" defaultValue="rui@atleta.app" className={portalInput} /></label>
        <label className="grid gap-1.5"><span className={portalLabel}>{t.dashsettings_phone}</span>
          <input type="tel" defaultValue="+351 912 345 678" className={portalInput} /></label>
        <button onClick={() => toast.success(t.dashsettings_saved)} className={portalBtnPrimary}>{t.dashsettings_save}</button>
      </section>

      <section className={card}>
        <h2 className={h2}>{t.dashsettings_notifications}</h2>
        {[
          { id: 'n1', label: t.dashsettings_n1, def: true },
          { id: 'n2', label: t.dashsettings_n2, def: true },
          { id: 'n3', label: t.dashsettings_n3, def: false },
        ].map((n) => (
          <div key={n.id} className="flex items-center justify-between">
            <label htmlFor={n.id} className="text-sm cursor-pointer text-portal-ink">{n.label}</label>
            <Switch id={n.id} defaultChecked={n.def} className="data-[state=checked]:bg-portal-copper" />
          </div>
        ))}
      </section>

      <section className={card}>
        <h2 className={`${h2} text-portal-copper`}>{t.dashsettings_danger}</h2>
        <p className="text-sm text-portal-muted">{t.dashsettings_danger_sub}</p>
        <button onClick={() => toast.error(t.dashsettings_delete_toast)}
          className="h-10 px-4 rounded-[4px] border border-portal-copper text-portal-copper hover:bg-portal-copper-tint font-display uppercase tracking-[0.1em] text-sm">
          {t.dashsettings_delete}
        </button>
      </section>
    </div>
  );
}
