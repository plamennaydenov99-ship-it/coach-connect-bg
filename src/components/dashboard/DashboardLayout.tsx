import { useState } from 'react';
import { NavLink, Link, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, UserCog, BarChart3, MessageSquare,
  CreditCard, Settings, Zap, Menu, X, ExternalLink,
  CalendarCheck, CalendarClock, ListChecks
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export function DashboardLayout() {
  const [open, setOpen] = useState(false);
  const { profile } = useAuth();
  const role = profile?.role;

  const NAV = (() => {
    const base = [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/dashboard/profile', label: 'My Profile', icon: UserCog },
    ];
    if (role === 'coach' || role === 'club') {
      base.push(
        { to: '/dashboard/availability', label: 'Availability', icon: CalendarClock } as any,
        { to: '/dashboard/requests', label: 'Booking requests', icon: ListChecks } as any,
        { to: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 } as any,
      );
    } else {
      base.push({ to: '/dashboard/bookings', label: 'My Bookings', icon: CalendarCheck } as any);
    }
    base.push(
      { to: '/dashboard/messages', label: 'Messages', icon: MessageSquare } as any,
      { to: '/dashboard/billing', label: 'Subscription', icon: CreditCard } as any,
      { to: '/dashboard/settings', label: 'Settings', icon: Settings } as any,
    );
    return base;
  })();

  const SidebarContent = () => (
    <>
      <Link to="/" className="flex items-center gap-2 px-5 h-16 border-b border-sidebar-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-foreground text-background">
          <Zap className="h-4 w-4" strokeWidth={2.5} />
        </div>
        <span className="font-display text-xl tracking-[0.08em] text-foreground">ATLETA</span>
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
                  ? 'border-primary bg-background-secondary text-foreground'
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
              <ExternalLink className="h-3.5 w-3.5 mr-2" /> View public profile
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
          <span className="font-display text-lg">Atleta</span>
          <span className="w-9" />
        </header>
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
