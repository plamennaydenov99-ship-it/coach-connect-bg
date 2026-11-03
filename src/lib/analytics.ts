/**
 * Optional audience measurement, loaded only after consent.
 *
 * No analytics account is set up. To switch it on, set these build-time variables
 * (see .env.example) and add the script's host to the CSP in public/_headers:
 *   VITE_ANALYTICS_SCRIPT_URL   e.g. the tracker script of an EU-hosted, cookieless tool
 *   VITE_ANALYTICS_SITE_ID      the site id the tool gives you
 *   VITE_ANALYTICS_SITE_ATTR    the attribute that carries the id (default data-website-id)
 * Then list the tool in the privacy and cookie pages.
 */
const SCRIPT_URL = import.meta.env.VITE_ANALYTICS_SCRIPT_URL as string | undefined;
const SITE_ID = import.meta.env.VITE_ANALYTICS_SITE_ID as string | undefined;
const SITE_ATTR = (import.meta.env.VITE_ANALYTICS_SITE_ATTR as string | undefined) || 'data-website-id';

export function analyticsConfigured(): boolean {
  return !!SCRIPT_URL && !!SITE_ID;
}

let loaded = false;

/** Adds the tracker script once. Callers must check consent first. */
export function loadAnalytics() {
  if (loaded || !analyticsConfigured() || typeof document === 'undefined') return;
  loaded = true;
  const s = document.createElement('script');
  s.src = SCRIPT_URL!;
  s.defer = true;
  s.setAttribute(SITE_ATTR, SITE_ID!);
  document.head.appendChild(s);
}
