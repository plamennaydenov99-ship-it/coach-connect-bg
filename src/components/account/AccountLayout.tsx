import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { DEMO_MODE } from '@/lib/demo';
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
    { to: '/account/program', label: t.account_program },
    { to: '/account/personal-info', label: t.dash_personal_info },
    { to: '/account/bookmarks', label: t.dash_bookmarks },
    { to: '/search', label: t.dash_browse_coaches },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <div className="bg-background-secondary">
        <div className="container flex h-16 items-center justify-between gap-4 overflow-x-auto">
          <nav className="flex items-center gap-1.5">
            {links.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `inline-flex h-11 items-center whitespace-nowrap px-4 font-display text-base font-bold uppercase transition-colors ${
                    isActive ? 'bg-foreground text-background' : 'bg-background text-foreground hover:bg-card'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          {!DEMO_MODE && (
          <Button variant="outline" size="sm" onClick={logout}>{t.auth_logout}</Button>
          )}
        </div>
      </div>
      <main className="container flex-1 py-12 md:py-16">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
