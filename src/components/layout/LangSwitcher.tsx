import type { Lang } from '@/context/LanguageContext';

const NAMES: Record<Lang, string> = { en: 'English', bg: 'Български', fr: 'Français' };

interface Props {
  lang: Lang;
  setLang: (l: Lang) => void;
  compact?: boolean;
}

export function LangSwitcher({ lang, setLang, compact = false }: Props) {
  const langs: Lang[] = ['en', 'bg', 'fr'];
  return (
    <div className={`flex items-center ${compact ? '-mx-1 mr-0' : '-mx-1.5'}`} role="group" aria-label="Language">
      {langs.map(l => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-label={`${l} ${NAMES[l]}`}
          aria-pressed={lang === l}
          lang={l}
          title={NAMES[l]}
          className={`inline-flex h-11 items-center ${compact ? 'px-1' : 'px-1.5'} font-display text-sm font-bold uppercase tracking-[0.04em] transition-opacity ${lang === l ? 'opacity-100 underline decoration-2 underline-offset-[6px]' : 'opacity-60 hover:opacity-100'}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
