// Cart removed from nav intentionally — appears contextually on /marketplace and coach booking only
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { LangSwitcher } from '@/components/layout/LangSwitcher';
import { useAuth } from '@/hooks/useAuth';
import { homeFor } from '@/lib/routes';
import { DEMO_MODE } from '@/lib/demo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function initialsOf(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

/** "solid" is a sand bar that sticks to the top. "overlay" sits on top of a photo. */
export function PublicNav({ variant = 'solid' }: { variant?: 'solid' | 'overlay' }) {
  const [open, setOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const overlay = variant === 'overlay';

  const displayName = profile?.full_name?.trim() || user?.email?.split('@')[0] || '';
  const initials = displayName ? initialsOf(displayName) : '?';
  const homePath = homeFor(profile?.role);

  const logout = async () => {
    await signOut();
    setOpen(false);
    navigate('/start', { replace: true });
  };

  const links = [
    { to: '/discover', label: t.tn_nav_trending },
    { to: '/search', label: t.nav_search },
    { to: '/events', label: t.nav_events },
    { to: '/camps', label: t.nav_camps },
    { to: '/for-coaches', label: t.footer_for_coaches },
  ];

  const shell = overlay
    ? 'absolute inset-x-0 top-0 z-50 text-[#F3EDE2]'
    : 'sticky top-0 z-50 border-b border-border bg-background text-foreground';
  const link = 'relative font-display uppercase tracking-[0.02em] text-base font-bold transition-opacity after:absolute after:left-0 after:-bottom-1.5 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:bg-current after:transition-transform hover:after:scale-x-100';
  const pill = overlay ? 'bg-[#F3EDE2]/15 hover:bg-[#F3EDE2]/25 text-[#F3EDE2]' : 'bg-background-secondary hover:bg-background-tertiary text-foreground';

  return (
    <header className={shell}>
      <div className="container flex h-16 md:h-20 items-center justify-between gap-6">
        <Link to="/" className="shrink-0 font-display text-3xl md:text-4xl font-extrabold tracking-[0.04em] text-current" style={{ color: 'inherit' }}>
          LOKKA
        </Link>

        <nav className="hidden lg:flex items-center gap-8" aria-label="Lokka">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => `${link} ${isActive ? 'after:scale-x-100' : 'opacity-85 hover:opacity-100'}`}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <LangSwitcher lang={lang} setLang={setLang} />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`flex items-center gap-2 pl-1 pr-3 h-11 transition-colors ${pill}`} aria-label={displayName}>
                  <span className="flex h-9 w-9 items-center justify-center bg-primary text-primary-foreground font-display text-sm font-bold">{initials}</span>
                  <span className="font-display uppercase tracking-[0.02em] text-sm font-bold max-w-[10rem] truncate">{displayName}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-popover">
                <DropdownMenuItem onClick={() => navigate(homePath)}>{t.account_title}</DropdownMenuItem>
                {(profile?.role === 'coach' || profile?.role === 'club') && (
                  <DropdownMenuItem onClick={() => navigate(`/${profile.role}/boost`)}>{t.tn_boost}</DropdownMenuItem>
                )}
                {profile?.is_admin && (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/admin')}>Admin overview</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/admin/review')}>Review applications</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/admin/users')}>People</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/admin/trending')}>{t.tr_nav}</DropdownMenuItem>
                  </>
                )}
                {!DEMO_MODE && <DropdownMenuItem onClick={logout}>{t.auth_logout}</DropdownMenuItem>}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : DEMO_MODE ? null : (
            <Link to="/start" className="group inline-flex h-11 items-center gap-2 bg-primary px-6 font-display text-base font-bold uppercase tracking-[0.02em] text-primary-foreground transition-colors hover:bg-primary-hover">
              {t.nav_login}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <LangSwitcher lang={lang} setLang={setLang} compact />
          <button type="button" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open} className={`h-10 w-10 grid place-items-center ${pill}`}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background text-foreground lg:hidden">
          <div className="container space-y-1 py-4">
            {links.map(l => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="block py-3 font-display text-2xl font-extrabold uppercase">{l.label}</Link>
            ))}
            <div className="pt-3">
              {user ? (
                <>
                  <Link to={homePath} onClick={() => setOpen(false)} className="block py-2 text-lg font-semibold">{displayName}</Link>
                  {!DEMO_MODE && <button onClick={logout} className="mt-2 h-12 w-full bg-primary font-display text-base font-bold uppercase text-primary-foreground">{t.auth_logout}</button>}
                </>
              ) : DEMO_MODE ? null : (
                <Link to="/start" onClick={() => setOpen(false)} className="grid h-12 w-full place-items-center bg-primary font-display text-base font-bold uppercase text-primary-foreground">{t.nav_login}</Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
