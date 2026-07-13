// Cart removed from nav intentionally — appears contextually on /marketplace and coach booking only
import { Link, NavLink } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';

export function PublicNav() {
  const [open, setOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();

  const links = [
    { to: '/search', label: 'Find a Coach' },
    { to: '/events', label: t.nav_events },
    { to: '/camps', label: t.nav_camps },
    { to: '/community', label: t.nav_community },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="container flex h-16 md:h-20 items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center bg-ice text-primary-foreground rounded-sm">
            <Zap className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <span className="font-display text-2xl md:text-3xl tracking-[0.08em] font-semibold text-ivory">ZENIT</span>
        </Link>


        <nav className="hidden lg:flex items-center gap-8">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `relative font-display uppercase tracking-[0.12em] text-sm font-semibold transition-colors after:absolute after:left-0 after:-bottom-1 after:h-px after:w-full after:scale-x-0 after:bg-accent-electric after:transition-transform hover:after:scale-x-100 ${
                  isActive ? 'text-foreground after:scale-x-100' : 'text-foreground-muted hover:text-foreground'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {/* Language toggle */}
          <div className="flex items-center gap-2 font-body text-xs">
            <button
              onClick={() => setLang('en')}
              className={`transition-colors ${lang === 'en' ? 'text-foreground' : 'text-foreground-subtle hover:text-foreground-muted'}`}
            >
              EN
            </button>
            <span className="h-3 w-px bg-border" />
            <button
              onClick={() => setLang('bg')}
              className={`transition-colors ${lang === 'bg' ? 'text-foreground' : 'text-foreground-subtle hover:text-foreground-muted'}`}
            >
              БГ
            </button>
          </div>
          <Link to="/login">
            <Button variant="ghost" className="h-10">{t.nav_login}</Button>
          </Link>
          <Link to="/dashboard">
            <Button
              variant="outline"
              className="h-10 border-foreground-subtle text-foreground-muted hover:border-accent-electric hover:text-foreground"
            >
              {t.nav_coach_cta}
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <div className="flex items-center gap-1.5 font-body text-xs mr-1">
            <button onClick={() => setLang('en')} className={lang === 'en' ? 'text-foreground' : 'text-foreground-subtle'}>EN</button>
            <span className="h-3 w-px bg-border" />
            <button onClick={() => setLang('bg')} className={lang === 'bg' ? 'text-foreground' : 'text-foreground-subtle'}>БГ</button>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <div className="container space-y-2 py-4">
            {links.map(l => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">{l.label}</Button>
              </Link>
            ))}
            <div className="my-2 h-px bg-border" />
            <Link to="/login" onClick={() => setOpen(false)} className="block">
              <Button variant="ghost" className="w-full">{t.nav_login}</Button>
            </Link>
            <Link to="/dashboard" onClick={() => setOpen(false)} className="block">
              <Button variant="outline" className="w-full">{t.nav_coach_cta}</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
