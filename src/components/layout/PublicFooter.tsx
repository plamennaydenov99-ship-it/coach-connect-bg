import { Link } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';

export function PublicFooter() {
  const { t } = useLanguage();
  const col = 'flex flex-col gap-3 text-base';
  return (
    <footer className="relative mt-24 overflow-hidden bg-foreground text-[#F3EDE2]">
      <div className="container pt-20">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-7">
            <p className="font-display text-4xl font-extrabold uppercase leading-[0.92] md:text-6xl" style={{ maxWidth: '14ch' }}>{t.tn_footer_line}</p>
            <p className="mt-6 max-w-md text-base text-[#F3EDE2]/80">{t.footer_tagline}</p>
          </div>
          <nav className={`md:col-span-2 ${col}`} aria-label={t.footer_explore}>
            <Link to="/discover" className="hover:underline">{t.tn_nav_trending}</Link>
            <Link to="/search" className="hover:underline">{t.footer_find_coach}</Link>
            <Link to="/clubs" className="hover:underline">{t.footer_browse_clubs}</Link>
            <Link to="/events" className="hover:underline">{t.nav_events}</Link>
            <Link to="/camps" className="hover:underline">{t.nav_camps}</Link>
          </nav>
          <nav className={`md:col-span-3 ${col}`} aria-label={t.footer_company}>
            <Link to="/for-coaches" className="hover:underline">{t.footer_for_coaches}</Link>
            <Link to="/start" className="hover:underline">{t.nav_login}</Link>
            <Link to="/" className="hover:underline">{t.footer_help}</Link>
            <Link to="/" className="hover:underline">{t.footer_privacy}</Link>
          </nav>
        </div>
        <p className="mt-16 max-w-[110ch] text-xs text-[#F3EDE2]/70">© {new Date().getFullYear()} Lokka. {t.footer_rights} {t.tn_credits}</p>
      </div>
      <div className="h-[min(22vw,330px)]" aria-hidden="true" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-[7vw] left-3 select-none whitespace-nowrap font-display font-extrabold uppercase leading-[0.8] text-[#F3EDE2]" style={{ fontSize: 'clamp(160px, 30vw, 460px)' }}>
        Lokka
      </div>
    </footer>
  );
}
