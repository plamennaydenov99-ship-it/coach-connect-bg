import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';
import { Search, CalendarCheck, Bookmark, User } from 'lucide-react';

const Account = () => {
  const { profile, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const logout = async () => {
    await signOut();
    toast.success(t.auth_signed_out);
    navigate('/start', { replace: true });
  };

  const tiles = [
    { to: '/search', label: t.dash_browse_coaches, icon: Search },
    { to: '/dashboard/bookings', label: t.dash_bookings, icon: CalendarCheck },
    { to: '/dashboard/bookmarks', label: t.dash_bookmarks, icon: Bookmark },
    { to: '/dashboard/personal-info', label: t.dash_personal_info, icon: User },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <main className="flex-1 container max-w-3xl py-16">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl uppercase tracking-[0.08em]">{t.account_title}</h1>
            <p className="mt-2 text-muted-foreground font-body">
              {t.account_welcome}{profile?.full_name ? `, ${profile.full_name}` : ''}.
            </p>
          </div>
          <Button variant="outline" onClick={logout}>{t.auth_logout}</Button>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tiles.map(tile => (
            <Link
              key={tile.to}
              to={tile.to}
              className="surface p-6 flex items-center gap-3 hover:border-gold transition-colors"
            >
              <tile.icon className="h-5 w-5 text-gold" />
              <span className="font-display uppercase tracking-[0.1em] text-sm">{tile.label}</span>
            </Link>
          ))}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
};

export default Account;
