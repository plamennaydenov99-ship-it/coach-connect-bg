import { useState } from 'react';
import { NavLink, Link, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, UserCog, BarChart3, MessageSquare,
  CreditCard, Settings, Zap, Menu, X, ExternalLink,
  CalendarCheck, CalendarClock, ListChecks, Search, User, Bookmark
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';

export function DashboardLayout() {
  const [open, setOpen] = useState(false);
  const { profile, loading } = useAuth();
  const { t } = useLanguage();
  const role = profile?.role;

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading your dashboard…
      </div>
    );
  }

  const NAV = (() => {
    if (role === 'athlete') {
      return [
        { to: '/dashboard', label: t.dash_home, icon: LayoutDashboard, end: true },
        { to: '/dashboard/bookings', label: t.dash_bookings, icon: CalendarCheck },
        { to: '/dashboard/personal-info', label: t.dash_personal_info, icon: User },
        { to: '/dashboard/bookmarks', label: t.dash_bookmarks, icon: Bookmark },
        { to: '/dashboard/messages', label: t.dash_messages, icon: MessageSquare },
        { to: '/search', label: t.dash_browse_coaches, icon: Search },
        { to: '/dashboard/settings', label: t.dash_settings, icon: Settings },
      ];
    }
    if (role === 'club') {
      return [
        { to: '/dashboard', label: t.dash_home, icon: LayoutDashboard, end: true },
        { to: '/dashboard/profile', label: t.dash_profile_club, icon: UserCog },
        { to: '/dashboard/messages', label: t.dash_messages, icon: MessageSquare },
        { to: '/dashboard/billing', label: t.dash_billing, icon: CreditCard },
        { to: '/dashboard/settings', label: t.dash_settings, icon: Settings },
      ];
    }
    // coach (default)
    return [
      { to: '/dashboard', label: t.dash_home, icon: LayoutDashboard, end: true },
      { to: '/dashboard/profile', label: t.dash_profile_coach, icon: UserCog },
      { to: '/dashboard/availability', label: t.dash_availability, icon: CalendarClock },
      { to: '/dashboard/requests', label: t.dash_requests, icon: ListChecks },
      { to: '/dashboard/messages', label: t.dash_messages, icon: MessageSquare },
      { to: '/dashboard/analytics', label: t.dash_analytics, icon: BarChart3 },
      { to: '/dashboard/billing', label: t.dash_billing, icon: CreditCard },
      { to: '/dashboard/settings', label: t.dash_settings, icon: Settings },
    ];
  })();

  const SidebarContent = () => (
    <>
      <Link to="/" className="flex items-center gap-2 px-5 h-16 border-b border-sidebar-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-foreground text-background">
          <Zap className="h-4 w-4" strokeWidth={2.5} />
        </div>
        <span className="font-display text-xl tracking-[0.08em] text-foreground">ZENIT</span>
      </Link>
      <nav className="flex-1 p-2 space-y-0.5">
        {NAV.map((item: any) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 text-sm font-display uppercase tracking-[0.1em] transition-colors border-l-2 ${
                isActive
                  ? 'border-gold bg-background-secondary text-foreground'
                  : 'border-transparent text-foreground-subtle hover:text-foreground-muted'
              }`
            }
          >
            <item.icon className="h-4 w-4" /> {item.label}
          </NavLink>
        ))}
      </nav>
      {(role === 'coach' || role === 'club') && (
        <div className="p-3 border-t border-sidebar-border">
          <Link to={role === 'coach' ? `/coach/${profile?.id}` : `/club/${profile?.id}`}>
            <Button variant="outline" size="sm" className="w-full">
              <ExternalLink className="h-3.5 w-3.5 mr-2" /> {t.dash_view_public}
            </Button>
          </Link>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen flex w-full bg-background">
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar border-r border-sidebar-border sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-background/70" onClick={() => setOpen(false)} />
          <aside className="relative flex w-64 h-full flex-col bg-sidebar border-r border-sidebar-border">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden h-14 flex items-center justify-between px-4 border-b border-border bg-background sticky top-0 z-40">
          <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <span className="font-display text-lg">Zenit</span>
          <span className="w-9" />
        </header>
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
