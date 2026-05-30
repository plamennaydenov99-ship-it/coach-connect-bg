import { useState } from 'react';
import { X } from 'lucide-react';

const MESSAGE = 'EARLY ACCESS — Free listing for coaches through Q3 2025';
const CTA_LABEL = 'Apply now';

export function AnnouncementBar() {
  const [open, setOpen] = useState(true);
  if (!open) return null;

  return (
    <div className="relative bg-background-secondary border-l-2 border-primary">
      <div className="container flex items-center justify-center gap-3 py-2.5 text-center">
        <span className="font-display uppercase tracking-[0.15em] text-[12px] md:text-[13px] text-foreground-muted">
          <span className="text-primary mr-2">◆</span>
          <span className="text-secondary">{MESSAGE}</span>
        </span>
        <a
          href="/register"
          className="hidden md:inline font-display uppercase tracking-[0.15em] text-[12px] text-foreground hover:text-secondary transition-colors"
        >
          → {CTA_LABEL}
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
