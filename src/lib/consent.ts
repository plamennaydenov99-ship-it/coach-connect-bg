/**
 * Cookie and storage consent, built to the CNIL standard:
 * nothing optional runs before a choice, "Reject all" is as easy as "Accept all",
 * the choice is stored with a timestamp and banner version, and it expires after 13 months.
 *
 * Today Lokka has no optional purpose switched on, so the banner only appears once an
 * analytics tool is configured (see src/lib/analytics.ts). The footer "Cookie settings"
 * link always works.
 */
import { analyticsConfigured } from '@/lib/analytics';

/** Bump when the purposes or the banner text change: everyone is asked again. */
export const CONSENT_VERSION = 1;
const KEY = 'lokka_consent';
/** 13 months, the CNIL maximum before asking again. */
const MAX_AGE_MS = 395 * 24 * 60 * 60 * 1000;

export type Purpose = 'analytics';
export type Choices = Record<Purpose, boolean>;
export type ConsentRecord = { version: number; decidedAt: string; choices: Choices };

export const SETTINGS_EVENT = 'lokka:cookie-settings';
export const CHANGE_EVENT = 'lokka:consent-change';

/** Purposes that need consent and are actually in use. */
export function optionalPurposes(): Purpose[] {
  return analyticsConfigured() ? ['analytics'] : [];
}

export function readConsent(): ConsentRecord | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const rec = JSON.parse(raw) as ConsentRecord;
    if (rec.version !== CONSENT_VERSION) return null;
    if (Date.now() - new Date(rec.decidedAt).getTime() > MAX_AGE_MS) return null;
    return rec;
  } catch {
    return null;
  }
}

export function hasConsent(purpose: Purpose): boolean {
  return !!readConsent()?.choices[purpose];
}

export function saveConsent(choices: Choices) {
  const rec: ConsentRecord = { version: CONSENT_VERSION, decidedAt: new Date().toISOString(), choices };
  try { localStorage.setItem(KEY, JSON.stringify(rec)); } catch { /* private mode: the banner simply asks again */ }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: rec }));
}

/** Opens the settings panel from anywhere, e.g. the footer link. */
export function openCookieSettings() {
  window.dispatchEvent(new Event(SETTINGS_EVENT));
}
