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

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved === 'en' || saved === 'bg' || saved === 'fr') setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
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
