import { Link } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { openCookieSettings } from '@/lib/consent';

export function PublicFooter() {
  const { t } = useLanguage();
  const col = 'flex flex-col gap-3 text-base';
  const item = 'hover:underline';
  return (
    <footer className="relative mt-24 overflow-hidden bg-foreground text-[#F3EDE2]">
      <div className="container pt-20">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-7">
            <p className="font-display text-4xl font-extrabold uppercase leading-[0.92] md:text-6xl" style={{ maxWidth: '14ch' }}>{t.tn_footer_line}</p>
            <p className="mt-6 max-w-md text-base text-[#F3EDE2]/80">{t.footer_tagline}</p>
          </div>
          <nav className={`md:col-span-2 ${col}`} aria-label={t.footer_explore}>
            <Link to="/discover" className={item}>{t.tn_nav_trending}</Link>
            <Link to="/search" className={item}>{t.footer_find_coach}</Link>
            <Link to="/clubs" className={item}>{t.footer_browse_clubs}</Link>
            <Link to="/events" className={item}>{t.nav_events}</Link>
            <Link to="/camps" className={item}>{t.nav_camps}</Link>
          </nav>
          <nav className={`md:col-span-3 ${col}`} aria-label={t.footer_company}>
            <Link to="/for-coaches" className={item}>{t.footer_for_coaches}</Link>
            <Link to="/start" className={item}>{t.nav_login}</Link>
            <Link to="/legal#contact" className={item}>{t.footer_help}</Link>
          </nav>
        </div>
        <nav aria-label={t.footer_legal} className="mt-16 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <Link to="/privacy" className="inline-flex min-h-11 items-center hover:underline">{t.footer_privacy}</Link>
          <Link to="/terms" className="inline-flex min-h-11 items-center hover:underline">{t.footer_terms}</Link>
          <Link to="/legal" className="inline-flex min-h-11 items-center hover:underline">{t.footer_legal_notice}</Link>
          <Link to="/cookies" className="inline-flex min-h-11 items-center hover:underline">{t.footer_cookies}</Link>
          <Link to="/accessibility" className="inline-flex min-h-11 items-center hover:underline">{t.footer_accessibility}</Link>
          <button type="button" onClick={openCookieSettings} className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">{t.footer_cookie_settings}</button>
        </nav>
        <p className="mt-4 max-w-[110ch] text-xs text-[#F3EDE2]/70">© {new Date().getFullYear()} Lokka. {t.footer_rights} {t.tn_credits}</p>
      </div>
      <div className="h-[min(22vw,330px)]" aria-hidden="true" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-[7vw] left-3 select-none whitespace-nowrap font-display font-extrabold uppercase leading-[0.8] text-[#F3EDE2]" style={{ fontSize: 'clamp(160px, 30vw, 460px)' }}>
        Lokka
      </div>
    </footer>
  );
}
