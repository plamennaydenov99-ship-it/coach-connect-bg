import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { t as translations } from '@/lib/translations';

export type Lang = 'en' | 'bg' | 'fr';

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Record<keyof (typeof translations)['en'], string>;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = 'atleta_lang';

/** Default language from the device time zone: France → French, Bulgaria → Bulgarian, anywhere else → English. */
export function detectLang(): Lang {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === 'Europe/Paris') return 'fr';
    if (tz === 'Europe/Sofia') return 'bg';
  } catch { /* no Intl time zone support */ }
  return 'en';
}

/** A language picked with the switcher wins; otherwise follow the device (not saved, so travelling updates it). */
function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'bg' || saved === 'fr') return saved;
  } catch { /* storage blocked */ }
  return detectLang();
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* storage blocked */ }
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
}

/** Overrides selected strings for a subtree, e.g. club wording in reused staff pages. */
export function LanguageOverride({ overrides, children }: { overrides: Partial<LanguageContextValue['t']>; children: ReactNode }) {
  const ctx = useLanguage();
  const value = useMemo(() => ({ ...ctx, t: { ...ctx.t, ...overrides } }), [ctx, overrides]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
