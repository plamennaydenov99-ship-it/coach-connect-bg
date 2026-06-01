import { useState } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export function AnnouncementBar() {
  const [open, setOpen] = useState(true);
  const { t } = useLanguage();
  if (!open) return null;

  return (
    <div className="relative bg-background-secondary border-l-2 border-ember">
      <div className="container flex items-center justify-center gap-3 py-2.5 text-center">
        <span className="font-display uppercase tracking-[0.15em] text-[12px] md:text-[13px] text-foreground-muted">
          <span className="text-ember mr-2">◆</span>
          <span className="text-ivory">{t.announcement}</span>
        </span>
        <a
          href="/register"
          className="hidden md:inline font-display uppercase tracking-[0.15em] text-[12px] text-ice hover:text-ivory transition-colors"
        >

          → {t.announcement_cta}
        </a>
      </div>
      <button
        onClick={() => setOpen(false)}
        aria-label="Dismiss"
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-foreground-muted hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
