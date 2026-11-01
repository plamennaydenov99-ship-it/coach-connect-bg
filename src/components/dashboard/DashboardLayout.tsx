import { useState } from 'react';
import { DEMO_MODE } from '@/lib/demo';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, UserCog, BarChart3, MessageSquare,
  CreditCard, Settings, Menu, X, ExternalLink,
  CalendarCheck, CalendarClock, ListChecks, Search, User, Users, Bookmark, LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';

export function DashboardLayout() {
  const [open, setOpen] = useState(false);
  const { profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const role = profile?.role;

  const logout = async () => {
    await signOut();
    toast.success(t.auth_signed_out);
    navigate('/start', { replace: true });
  };

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
      { to: '/dashboard/clients', label: t.dash_clients, icon: Users },
      { to: '/dashboard/messages', label: t.dash_messages, icon: MessageSquare },
      { to: '/dashboard/analytics', label: t.dash_analytics, icon: BarChart3 },
      { to: '/dashboard/billing', label: t.dash_billing, icon: CreditCard },
      { to: '/dashboard/settings', label: t.dash_settings, icon: Settings },
    ];
  })();

  const SidebarContent = () => (
    <>
      <Link to="/" className="flex h-16 items-center px-5">
        <span className="font-display text-3xl font-extrabold tracking-[0.04em] text-[#F3EDE2]">LOKKA</span>
      </Link>
      <nav className="flex-1 p-2 space-y-0.5">
        {NAV.map((item: any) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 font-display text-base font-bold uppercase transition-colors ${
                isActive
                  ? 'bg-[#F3EDE2] text-foreground'
                  : 'text-[#F3EDE2]/80 hover:bg-[#F3EDE2]/10 hover:text-[#F3EDE2]'
              }`
            }
          >
            <item.icon className="h-4 w-4" /> {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3">
        {!DEMO_MODE && (
        <Button variant="ghost" size="sm" className="w-full justify-start text-[#F3EDE2] hover:bg-[#F3EDE2]/10 hover:text-[#F3EDE2]" onClick={logout}>
          <LogOut className="h-3.5 w-3.5 mr-2" /> {t.auth_logout}
        </Button>
        )}
      </div>
      {(role === 'coach' || role === 'club') && (
        <div className="p-3">
          <Link to={role === 'coach' ? `/coaches/${profile?.id}` : `/clubs/${profile?.id}`}>
            <Button variant="outline" size="sm" className="w-full bg-[#F3EDE2] text-foreground hover:bg-white">
              <ExternalLink className="h-3.5 w-3.5 mr-2" /> {t.dash_view_public}
            </Button>
          </Link>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen flex w-full bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-foreground md:flex">
        <SidebarContent />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-background/70" onClick={() => setOpen(false)} />
          <aside className="relative flex h-full w-64 flex-col bg-foreground">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between bg-foreground px-4 text-[#F3EDE2] md:hidden">
          <Button variant="ghost" size="icon" className="text-[#F3EDE2] hover:bg-[#F3EDE2]/10 hover:text-[#F3EDE2]" onClick={() => setOpen(!open)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <span className="font-display text-2xl font-extrabold tracking-[0.04em]">LOKKA</span>
          <span className="w-9" />
        </header>
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
