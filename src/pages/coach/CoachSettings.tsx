import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
