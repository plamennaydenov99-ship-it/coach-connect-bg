import { useState } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, UserCog, BarChart3, MessageSquare,
  CreditCard, Settings, Zap, Menu, X, ExternalLink, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/profile', label: 'My Profile', icon: UserCog },
  { to: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/dashboard/messages', label: 'Messages', icon: MessageSquare },
  { to: '/dashboard/billing', label: 'Subscription', icon: CreditCard },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function DashboardLayout() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const switchRole = () => {
    localStorage.removeItem('atleta_role');
    navigate('/');
  };

  const SidebarContent = () => (
    <>
      <Link to="/" className="flex items-center gap-2 px-5 h-16 border-b border-sidebar-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-foreground text-background">
          <Zap className="h-4 w-4" strokeWidth={2.5} />
        </div>
        <span className="font-display text-xl tracking-[0.08em] text-foreground">ATLETA</span>
      </Link>
      <nav className="flex-1 p-2 space-y-0.5">
        {NAV.map(item => (
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
      <div className="p-3 border-t border-sidebar-border space-y-2">
        <Link to="/coach/dimitar-petrov">
          <Button variant="outline" size="sm" className="w-full">
            <ExternalLink className="h-3.5 w-3.5 mr-2" /> View public profile
          </Button>
        </Link>
        <button
          onClick={switchRole}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-display uppercase tracking-[0.12em] text-foreground-subtle hover:text-foreground transition-colors"
        >
          <RefreshCw className="h-3 w-3" /> Switch to athlete view
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar border-r border-sidebar-border sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
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
