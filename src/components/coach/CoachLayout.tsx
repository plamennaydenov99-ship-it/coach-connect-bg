import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { QuickBookDialog } from '@/components/coach/calendar/QuickBookDialog';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, CalendarDays, MessageSquare, UserCircle2, Settings,
  Bell, Plus, LogOut, ExternalLink, Zap, Sun,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage, type Lang } from '@/context/LanguageContext';
import { coachProfilePath } from '@/lib/routes';
import { toast } from 'sonner';
import { useUnreadCount } from '@/hooks/coach/useUnreadCount';
import { useCoachInbox } from '@/hooks/coach/useCoachDashboard';

const LANGS: Lang[] = ['en', 'bg', 'fr'];

function initials(name?: string | null) {
  if (!name) return 'C';
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || 'C';
}

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-3 h-10 rounded-[4px] border text-[15px] transition-colors ${
    isActive
      ? 'bg-portal-selected border-portal-selected-border text-portal-ink font-medium'
      : 'border-transparent text-portal-muted-strong hover:text-portal-ink hover:bg-portal-bg'
  }`;

export function CoachLayout() {
  const { profile, signOut } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const [bookingOpen, setBookingOpen] = useState(false);
  const { count: unread, byConvo } = useUnreadCount();
  const { data: inbox } = useCoachInbox(50);
  const unreadConvos = [...byConvo.entries()].slice(0, 6).map(([id, msgs]) => ({
    id, n: msgs.length, preview: msgs[0]?.content ?? '', name: inbox?.find((c) => c.id === id)?.name ?? '',
  }));

  const logout = async () => {
    await signOut();
    toast.success(t.auth_signed_out);
    navigate('/start', { replace: true });
  };

  const name = (profile as any)?.full_name as string | undefined;

  const main = [
    { to: '/coach/dashboard', label: t.portal_dashboard, icon: LayoutDashboard },
    { to: '/coach/clients', label: t.portal_clients, icon: Users },
    { to: '/coach/calendar', label: t.portal_calendar, icon: CalendarDays },
    { to: '/coach/messages', label: t.portal_messages, icon: MessageSquare, badge: unread },
  ];
  const account = [
    { to: '/coach/profile', label: t.portal_public_profile, icon: UserCircle2 },
    { to: '/coach/settings', label: t.portal_settings, icon: Settings },
  ];
  const tabs = [
    { to: '/coach/dashboard', label: t.portal_today, icon: Sun },
    { to: '/coach/clients', label: t.portal_clients, icon: Users },
    { to: '/coach/calendar', label: t.portal_calendar, icon: CalendarDays },
    { to: '/coach/messages', label: t.portal_messages, icon: MessageSquare, badge: unread },
  ];

  return (
    <div className="coach-portal min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 h-14 md:h-16 flex items-center gap-3 px-4 md:px-6 bg-portal-card border-b border-portal-border">
        <Link to="/coach/dashboard" className="flex items-center gap-2 shrink-0">
          <span className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-portal-ink text-portal-card">
            <Zap className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <span className="font-display text-xl tracking-[0.08em] text-portal-ink">LOKKA</span>
          <span className="font-display text-[11px] tracking-[0.14em] uppercase px-1.5 py-0.5 rounded-[4px] border border-portal-copper text-portal-coral-text">
            {t.portal_coach_tag}
          </span>
        </Link>

        <div className="flex-1" />

        <Button
          variant="portal"
          aria-label={t.portal_new_session}
          onClick={() => setBookingOpen(true)}
          className="inline-flex items-center gap-1.5 h-9 px-3 md:px-4 rounded-[4px] bg-portal-copper hover:bg-portal-copper-hover text-portal-on-copper font-display uppercase tracking-[0.1em] text-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t.portal_new_session}</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={t.portal_notifications}
            className="relative h-9 w-9 flex items-center justify-center rounded-[4px] border border-portal-border text-portal-muted-strong hover:text-portal-ink"
          >
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-[4px] bg-portal-copper text-portal-on-copper text-[11px] leading-[18px] text-center">
                {unread}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="coach-portal w-64 bg-portal-card border-portal-border text-portal-ink">
            <DropdownMenuLabel className="font-display uppercase tracking-[0.12em] text-xs text-portal-muted">
              {t.portal_notifications}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-portal-border" />
            {unread > 0 ? (
              <>
                {unreadConvos.map((c) => (
                  <DropdownMenuItem key={c.id} onClick={() => navigate(`/coach/messages?c=${c.id}`)} className="flex-col items-start gap-0.5">
                    <span className="text-sm font-medium flex w-full justify-between gap-2"><span className="truncate">{c.name}</span><span className="text-portal-blue text-xs">{c.n}</span></span>
                    <span className="text-xs text-portal-muted truncate w-full">{c.preview}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-portal-border" />
                <DropdownMenuItem onClick={() => navigate('/coach/messages')}>{unread} {t.portal_unread_count}</DropdownMenuItem>
              </>
            ) : (
              <div className="px-2 py-3 text-sm text-portal-muted">{t.portal_no_notifications}</div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={t.portal_account_menu}
            className="flex items-center gap-2 h-9 pl-1 pr-1 md:pr-3 rounded-[4px] border border-portal-border hover:border-portal-input"
          >
            <span className="h-7 w-7 rounded-[4px] bg-portal-selected text-portal-ink flex items-center justify-center font-display text-sm tracking-[0.05em]">
              {initials(name)}
            </span>
            <span className="hidden md:inline text-sm text-portal-ink max-w-[140px] truncate">{name}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="coach-portal w-56 bg-portal-card border-portal-border text-portal-ink">
            <DropdownMenuLabel className="text-sm font-medium truncate">{name}</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-portal-border" />
            {profile?.id && (
              <DropdownMenuItem onClick={() => navigate(coachProfilePath(profile.id))}>
                <ExternalLink className="h-4 w-4 mr-2" /> {t.portal_view_public}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => navigate('/coach/settings')}>
              <Settings className="h-4 w-4 mr-2" /> {t.portal_settings}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-portal-border" />
            <DropdownMenuLabel className="font-display uppercase tracking-[0.12em] text-xs text-portal-muted">
              {t.portal_language}
            </DropdownMenuLabel>
            <div className="flex gap-1 px-2 pb-2">
              {LANGS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`flex-1 h-8 rounded-[4px] border font-display uppercase tracking-[0.1em] text-xs ${
                    lang === l
                      ? 'bg-portal-selected border-portal-selected-border text-portal-ink'
                      : 'border-portal-border text-portal-muted-strong hover:text-portal-ink'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            <DropdownMenuSeparator className="bg-portal-border" />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" /> {t.portal_logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Side menu: tablet+ (hidden on phones, full width ≥1024px) */}
        <aside className="hidden md:flex w-[200px] lg:w-[232px] shrink-0 flex-col gap-1 p-3 bg-portal-card border-r border-portal-border sticky top-16 h-[calc(100vh-4rem)]">
          {main.map((item) => (
            <NavLink key={item.to} to={item.to} className={navItemClass}>
              <item.icon className="h-4 w-4" />
              <span className="flex-1">{item.label}</span>
              {!!item.badge && (
                <span className="min-w-[20px] h-5 px-1 rounded-[4px] bg-portal-copper text-portal-on-copper text-xs leading-5 text-center">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
          <div className="mt-5 mb-1 px-3 font-display uppercase tracking-[0.14em] text-[11px] text-portal-muted">
            {t.portal_account}
          </div>
          {account.map((item) => (
            <NavLink key={item.to} to={item.to} className={navItemClass}>
              <item.icon className="h-4 w-4" />
              <span className="flex-1">{item.label}</span>
            </NavLink>
          ))}
        </aside>

        {/* Main content — fluid; pages may render their own right-side panel. */}
        <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>

      <QuickBookDialog open={bookingOpen} onOpenChange={setBookingOpen} />

      {/* Mobile bottom tabs */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 grid grid-cols-4 bg-portal-card border-t border-portal-border">
        {tabs.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center gap-1 font-display uppercase tracking-[0.1em] text-[11px] ${
                isActive ? 'text-portal-blue' : 'text-portal-muted-strong'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
            {!!item.badge && (
              <span className="absolute top-2 right-[calc(50%-18px)] min-w-[16px] h-4 px-1 rounded-[4px] bg-portal-copper text-portal-on-copper text-[10px] leading-4 text-center">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
