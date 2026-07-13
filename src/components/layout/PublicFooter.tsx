import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export function PublicFooter() {
  const { t } = useLanguage();
  return (
    <footer className="border-t border-border bg-card/40 mt-20">
      <div className="container py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <span className="font-display text-lg">Zenit</span>
          </Link>
          <p className="mt-3 text-sm text-muted-foreground max-w-sm">
            {t.footer_tagline}
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold mb-3">{t.footer_explore}</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/search" className="hover:text-foreground">{t.footer_find_coach}</Link></li>
            <li><Link to="/search?type=club" className="hover:text-foreground">{t.footer_browse_clubs}</Link></li>
            <li><Link to="/for-coaches" className="hover:text-foreground">{t.footer_for_coaches}</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold mb-3">{t.footer_company}</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground">{t.footer_about}</Link></li>
            <li><Link to="/" className="hover:text-foreground">{t.footer_help}</Link></li>
            <li><Link to="/" className="hover:text-foreground">{t.footer_privacy}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container py-5 text-xs text-muted-foreground flex flex-wrap justify-between gap-2">
          <span>© {new Date().getFullYear()} Zenit. {t.footer_rights}</span>
          <span>{t.footer_made_for}</span>
        </div>
      </div>
    </footer>
  );
}
