import { useEffect, useState } from 'react';
import type { Lang } from '@/context/LanguageContext';

export const LOCALES: Record<Lang, string> = { en: 'en-GB', bg: 'bg-BG', fr: 'fr-FR' };

export function initials(name?: string | null) {
  if (!name) return '?';
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <span
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className="flex shrink-0 items-center justify-center rounded-none bg-portal-ink font-display font-bold text-portal-card"
    >
      {initials(name)}
    </span>
  );
}

export function isToday(iso: string, timeZone = 'Europe/Sofia') {
  const f = (x: Date) => x.toLocaleDateString('en-CA', { timeZone });
  return f(new Date(iso)) === f(new Date());
}

export function fmtDateTime(iso: string, lang: Lang, timeZone?: string) {
  return new Date(iso).toLocaleString(LOCALES[lang], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone });
}

export function fmtDate(iso: string, lang: Lang, timeZone?: string) {
  // Plain YYYY-MM-DD values are calendar dates: render them without shifting.
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return new Date(iso + 'T12:00:00Z').toLocaleDateString(LOCALES[lang], { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  return new Date(iso).toLocaleDateString(LOCALES[lang], { day: 'numeric', month: 'short', year: 'numeric', timeZone });
}

/** True on touch-first devices (no drag & drop there). */
export function useCoarsePointer() {
  const q = '(pointer: coarse)';
  const [coarse, setCoarse] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const h = () => setCoarse(m.matches);
    m.addEventListener('change', h);
    return () => m.removeEventListener('change', h);
  }, []);
  return coarse;
}

export const stageKey = (s: string) => `crm_stage_${s}` as const;

export const portalInput =
  'w-full h-11 px-3 rounded-none border border-portal-input bg-portal-card text-portal-ink placeholder:text-portal-muted focus:outline-none focus:border-portal-ink text-base';

export const portalBtnPrimary =
  'inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-none bg-portal-copper hover:bg-portal-copper-hover text-portal-on-copper font-display font-bold uppercase text-sm transition-colors disabled:opacity-50';

export const portalBtnGhost =
  'inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-none bg-background-secondary hover:bg-background-tertiary text-portal-ink font-medium text-sm transition-colors disabled:opacity-50';

export const portalLabel = 'font-display uppercase text-xs font-bold text-portal-muted';
