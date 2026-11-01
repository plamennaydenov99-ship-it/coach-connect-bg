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
    <div>
      <h1 className="text-5xl md:text-6xl">{t.account_title}</h1>
      <p className="mt-3 text-xl text-muted-foreground">
        {t.account_welcome}{profile?.full_name ? `, ${profile.full_name}` : ''}.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {tiles.map(tile => (
          <Link
            key={tile.to}
            to={tile.to}
            className="surface group flex min-h-[160px] flex-col justify-between p-6 transition-transform duration-500 hover:-translate-y-2"
          >
            <tile.icon className="h-6 w-6 text-primary" />
            <span className="font-display text-4xl font-extrabold uppercase leading-[0.95]">{tile.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Account;
