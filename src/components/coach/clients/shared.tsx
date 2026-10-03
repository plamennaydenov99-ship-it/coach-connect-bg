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
      className="shrink-0 rounded-[4px] bg-portal-selected text-portal-ink border border-portal-selected-border flex items-center justify-center font-display tracking-[0.04em]"
    >
      {initials(name)}
    </span>
  );
}

export function isToday(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

export function fmtDateTime(iso: string, lang: Lang) {
  return new Date(iso).toLocaleString(LOCALES[lang], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function fmtDate(iso: string, lang: Lang) {
  return new Date(iso).toLocaleDateString(LOCALES[lang], { day: 'numeric', month: 'short', year: 'numeric' });
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
  'w-full h-10 px-3 rounded-[4px] border border-portal-input bg-portal-card text-portal-ink placeholder:text-portal-muted focus:outline-none focus:border-portal-copper text-sm';

export const portalBtnPrimary =
  'inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-[4px] bg-portal-copper hover:bg-portal-copper-hover text-portal-on-copper font-display uppercase tracking-[0.1em] text-sm transition-colors disabled:opacity-50';

export const portalBtnGhost =
  'inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-[4px] border border-portal-border text-portal-ink hover:border-portal-input bg-portal-card text-sm transition-colors disabled:opacity-50';

export const portalLabel = 'font-display uppercase tracking-[0.12em] text-[11px] text-portal-muted';
