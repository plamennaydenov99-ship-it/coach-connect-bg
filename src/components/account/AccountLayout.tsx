import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';

export function AccountLayout() {
  const { signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const logout = async () => {
    await signOut();
    toast.success(t.auth_signed_out);
    navigate('/start', { replace: true });
  };

  const links = [
    { to: '/account', label: t.account_title, end: true },
    { to: '/account/bookings', label: t.dash_bookings },
    { to: '/account/personal-info', label: t.dash_personal_info },
    { to: '/account/bookmarks', label: t.dash_bookmarks },
    { to: '/search', label: t.dash_browse_coaches },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <div className="border-b border-border">
        <div className="container flex items-center justify-between gap-4 h-14 overflow-x-auto">
          <nav className="flex items-center gap-5">
            {links.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `whitespace-nowrap font-display uppercase tracking-[0.1em] text-xs transition-colors ${
                    isActive ? 'text-gold' : 'text-foreground-subtle hover:text-foreground'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <Button variant="outline" size="sm" onClick={logout}>{t.auth_logout}</Button>
        </div>
      </div>
      <main className="flex-1 container py-10">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
