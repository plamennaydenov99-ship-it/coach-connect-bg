import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const NotFound = () => {
  const location = useLocation();
  const { t } = useLanguage();
  usePageMeta(t.meta_404_t, t.meta_404_d);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicNav />
      <main className="flex flex-1 flex-col justify-between bg-foreground text-[#F3EDE2]">
        <div className="container py-14">
          <p className="max-w-[28ch] text-xl md:text-2xl">{t.notfound_message}</p>
          <Link to="/" className="mt-8 inline-flex h-14 items-center bg-[#F3EDE2] px-7 font-display text-lg font-bold uppercase text-foreground transition-colors hover:bg-white">{t.notfound_return}</Link>
          <nav aria-label={t.notfound_or} className="mt-8">
            <p className="mb-2 text-sm text-[#F3EDE2]/85">{t.notfound_or}</p>
            <ul className="flex flex-wrap gap-x-6">
              {[['/discover', t.tn_nav_trending], ['/search', t.nav_search], ['/clubs', t.rd_nav_clubs], ['/events', t.nav_events], ['/for-coaches', t.footer_for_coaches]].map(([to, label]) => (
                <li key={to}><Link to={to} className="inline-flex min-h-11 items-center font-display text-lg font-bold uppercase underline-offset-4 hover:underline">{label}</Link></li>
              ))}
            </ul>
          </nav>
        </div>
        <p aria-hidden="true" className="select-none px-3 font-display font-extrabold leading-[0.8]" style={{ fontSize: 'clamp(200px, 40vw, 600px)', color: '#F3EDE2' }}>404</p>
      </main>
      <PublicFooter />
    </div>
  );
};

export default NotFound;
