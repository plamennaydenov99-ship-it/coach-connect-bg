import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { loadAnalytics } from '@/lib/analytics';
import { SETTINGS_EVENT, hasConsent, optionalPurposes, readConsent, saveConsent, type Choices } from '@/lib/consent';

/**
 * First layer: "Reject all" and "Accept all" side by side, same size and style, plus "Choose".
 * Second layer: one unticked switch per purpose. Shown only when an optional purpose exists,
 * or when someone opens "Cookie settings" from the footer.
 */
export function CookieBanner() {
  const { t } = useLanguage();
  const purposes = optionalPurposes();
  const [open, setOpen] = useState<'banner' | 'settings' | null>(() => (purposes.length && !readConsent() ? 'banner' : null));
  const [choices, setChoices] = useState<Choices>(() => ({ analytics: hasConsent('analytics') }));
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Load what was agreed to, on every page load.
  useEffect(() => { if (hasConsent('analytics')) loadAnalytics(); }, []);

  useEffect(() => {
    const onSettings = () => { setChoices({ analytics: hasConsent('analytics') }); setOpen('settings'); };
    window.addEventListener(SETTINGS_EVENT, onSettings);
    return () => window.removeEventListener(SETTINGS_EVENT, onSettings);
  }, []);

  useEffect(() => { if (open === 'settings') headingRef.current?.focus(); }, [open]);

  const decide = (next: Choices) => {
    const hadAnalytics = hasConsent('analytics');
    saveConsent(next);
    setOpen(null);
    if (next.analytics) loadAnalytics();
    // A script that already ran cannot be unloaded; reloading is the clean way to withdraw.
    else if (hadAnalytics) window.location.reload();
  };

  if (!open) return null;

  const btn = 'h-12 flex-1 px-5 font-display text-base font-bold uppercase transition-colors';
  const equal = `${btn} bg-[#F3EDE2] text-foreground hover:bg-white`;
  const none = { analytics: false };
  const all = { analytics: true };

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-title"
      className="fixed inset-x-0 bottom-0 z-[90] border-t-2 border-[#F3EDE2]/20 bg-foreground text-[#F3EDE2] sm:inset-x-auto sm:bottom-4 sm:right-4 sm:max-w-md"
    >
      <div className="max-h-[80vh] overflow-y-auto p-5 sm:p-6">
        <h2 id="cookie-title" ref={headingRef} tabIndex={-1} className="font-display text-2xl font-extrabold uppercase leading-none" style={{ color: 'inherit', fontSize: '1.5rem' }}>
          {open === 'banner' ? t.ck_title : t.ck_settings_title}
        </h2>

        {open === 'banner' ? (
          <>
            <p className="mt-3 text-sm">{t.ck_body} <Link to="/cookies" className="font-semibold underline underline-offset-4">{t.footer_cookies}</Link></p>
            <div className="mt-5 flex gap-2">
              <button type="button" className={equal} onClick={() => decide(none)}>{t.ck_reject}</button>
              <button type="button" className={equal} onClick={() => decide(all)}>{t.ck_accept}</button>
            </div>
            <button type="button" onClick={() => setOpen('settings')} className="mt-3 min-h-11 text-sm font-semibold underline underline-offset-4">{t.ck_choose}</button>
          </>
        ) : (
          <>
            <ul className="mt-4 space-y-4 text-sm">
              <li>
                <p className="font-semibold">{t.ck_essential}</p>
                <p className="mt-1 text-[#F3EDE2]/85">{t.ck_essential_body}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.06em] text-[#F3EDE2]/85">{t.ck_always_on}</p>
              </li>
              {purposes.includes('analytics') && (
                <li>
                  <label className="flex min-h-11 items-start gap-3">
                    <input
                      type="checkbox"
                      checked={choices.analytics}
                      onChange={e => setChoices({ ...choices, analytics: e.target.checked })}
                      className="mt-1 h-5 w-5 accent-[#F3EDE2]"
                    />
                    <span>
                      <span className="block font-semibold">{t.ck_analytics}</span>
                      <span className="mt-1 block text-[#F3EDE2]/85">{t.ck_analytics_body}</span>
                    </span>
                  </label>
                </li>
              )}
            </ul>
            {purposes.length === 0 && <p className="mt-4 text-sm">{t.ck_none_optional}</p>}
            <p className="mt-4 text-sm"><Link to="/cookies" className="font-semibold underline underline-offset-4" onClick={() => setOpen(null)}>{t.footer_cookies}</Link></p>
            <div className="mt-5 flex flex-wrap gap-2">
              {purposes.length > 0 ? (
                <>
                  <button type="button" className={equal} onClick={() => decide(none)}>{t.ck_reject}</button>
                  <button type="button" className={equal} onClick={() => decide(all)}>{t.ck_accept}</button>
                  <button type="button" className={`${btn} w-full flex-none border-2 border-[#F3EDE2] hover:bg-[#F3EDE2]/10`} onClick={() => decide(choices)}>{t.ck_save}</button>
                </>
              ) : (
                <button type="button" className={equal} onClick={() => setOpen(null)}>{t.ck_close}</button>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
