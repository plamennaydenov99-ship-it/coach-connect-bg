import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import { Search, CalendarCheck, Bookmark, User } from 'lucide-react';

const Account = () => {
  const { profile } = useAuth();
  const { t } = useLanguage();

  const tiles = [
    { to: '/search', label: t.dash_browse_coaches, icon: Search },
    { to: '/account/bookings', label: t.dash_bookings, icon: CalendarCheck },
    { to: '/account/bookmarks', label: t.dash_bookmarks, icon: Bookmark },
    { to: '/account/personal-info', label: t.dash_personal_info, icon: User },
  ];

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-4xl uppercase tracking-[0.08em]">{t.account_title}</h1>
      <p className="mt-2 text-muted-foreground font-body">
        {t.account_welcome}{profile?.full_name ? `, ${profile.full_name}` : ''}.
      </p>

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
    </div>
  );
};

export default Account;
