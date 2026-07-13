import type { Lang } from '@/context/LanguageContext';

const FLAGS: Record<Lang, { emoji: string; label: string }> = {
  en: { emoji: '🇬🇧', label: 'English' },
  bg: { emoji: '🇧🇬', label: 'Български' },
  fr: { emoji: '🇫🇷', label: 'Français' },
};

interface Props {
  lang: Lang;
  setLang: (l: Lang) => void;
  compact?: boolean;
}

export function LangSwitcher({ lang, setLang, compact = false }: Props) {
  const langs: Lang[] = ['en', 'bg', 'fr'];
  return (
    <div className={`flex items-center ${compact ? 'gap-1 mr-1' : 'gap-1.5'}`}>
      {langs.map((l, i) => (
        <div key={l} className="flex items-center">
          {i > 0 && <span className="h-3 w-px bg-border mx-1" />}
          <button
            type="button"
            onClick={() => setLang(l)}
            aria-label={FLAGS[l].label}
            title={FLAGS[l].label}
            className={`text-base leading-none transition-opacity ${
              lang === l ? 'opacity-100' : 'opacity-50 hover:opacity-80'
            }`}
          >
            <span aria-hidden="true">{FLAGS[l].emoji}</span>
          </button>
        </div>
      ))}
    </div>
  );
}
