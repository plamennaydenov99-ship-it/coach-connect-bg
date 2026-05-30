import { useState } from 'react';
import { X } from 'lucide-react';

// Edit this message to update the launch announcement bar
const MESSAGE = '🔥 LAUNCH OFFER — First 3 months FREE for coaches who join before July 1st';
const CTA_LABEL = 'Claim Now';

export function AnnouncementBar() {
  const [open, setOpen] = useState(true);
  if (!open) return null;

  return (
    <div className="relative bg-primary text-primary-foreground">
      <div className="container flex items-center justify-center gap-4 py-2 text-center text-sm font-semibold">
        <span className="font-condensed tracking-wide uppercase text-[13px] md:text-sm">
          {MESSAGE}
        </span>
        <a
          href="/register"
          className="hidden md:inline underline underline-offset-4 font-bold uppercase tracking-wider text-xs"
        >
          → {CTA_LABEL}
        </a>
      </div>
      <button
        onClick={() => setOpen(false)}
        aria-label="Dismiss"
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-primary-foreground/10 rounded-sm"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
