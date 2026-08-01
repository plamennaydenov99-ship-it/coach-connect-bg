// Cart removed from nav intentionally — appears contextually on /marketplace and coach booking only
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { LangSwitcher } from '@/components/layout/LangSwitcher';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(p => p[0])
    .join('')
    .toUpperCase();
}

export function PublicNav() {
  const [open, setOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const displayName =
    profile?.full_name?.trim() || user?.email?.split('@')[0] || '';
  const initials = displayName ? initialsOf(displayName) : '?';
  const homeFor = profile?.role === 'athlete' ? '/account' : '/dashboard';

  const logout = async () => {
    await signOut();
    setOpen(false);
    navigate('/start', { replace: true });
  };

  const links = [
    { to: '/search', label: t.nav_search },
    { to: '/events', label: t.nav_events },
    { to: '/camps', label: t.nav_camps },
  ];


  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="container flex h-16 md:h-20 items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center bg-navy text-primary-foreground rounded-sm">
            <Zap className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <span className="font-display text-2xl md:text-3xl tracking-[0.08em] font-semibold text-foreground">ZENIT</span>
        </Link>


        <nav className="hidden lg:flex items-center gap-8">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `relative font-display uppercase tracking-[0.12em] text-sm font-semibold transition-colors after:absolute after:left-0 after:-bottom-1 after:h-px after:w-full after:scale-x-0 after:bg-navy after:transition-transform hover:after:scale-x-100 ${
                  isActive ? 'text-foreground after:scale-x-100' : 'text-foreground-muted hover:text-foreground'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <LangSwitcher lang={lang} setLang={setLang} />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 border border-border px-3 h-11 rounded-sm hover:border-foreground-muted transition-colors"
                  aria-label={displayName}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground font-display text-xs">
                    {initials}
                  </span>
                  <span className="font-display uppercase tracking-[0.1em] text-xs max-w-[10rem] truncate">
                    {displayName}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-popover">
                <DropdownMenuItem onClick={() => navigate(homeFor)}>
                  {t.account_title}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>{t.auth_logout}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/start">
              <Button size="lg" className="h-11 px-6 tracking-[0.12em] font-display uppercase text-sm">
                {t.nav_login}
              </Button>
            </Link>
          )}
        </div>


        <div className="flex items-center gap-2 md:hidden">
          <LangSwitcher lang={lang} setLang={setLang} compact />
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
            {user ? (
              <>
                <Link to={homeFor} onClick={() => setOpen(false)} className="block">
                  <Button variant="ghost" className="w-full justify-start">{displayName}</Button>
                </Link>
                <Button size="lg" onClick={logout} className="w-full font-display uppercase tracking-[0.12em]">
                  {t.auth_logout}
                </Button>
              </>
            ) : (
              <Link to="/start" onClick={() => setOpen(false)} className="block">
                <Button size="lg" className="w-full font-display uppercase tracking-[0.12em]">{t.nav_login}</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
