import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Eye, MessageSquare, BadgeCheck, Crown, ChevronRight, Inbox, CheckCircle2, CalendarCheck, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/context/LanguageContext';

const DashboardHome = () => {
  const { user, profile, loading } = useAuth();
  const { t } = useLanguage();
  const firstName = (profile?.full_name || '').trim().split(' ')[0] || t.dashhome_there;
  const role = profile?.role;

  const [checklist, setChecklist] = useState<{ label: string; done: boolean }[]>([]);
  const [athleteStats, setAthleteStats] = useState({ upcoming: 0, pending: 0, unread: 0 });

  useEffect(() => {
    if (!user || !profile) return;
    (async () => {
      const base = [
        { label: t.dashhome_task_name, done: !!profile.full_name },
        { label: t.dashhome_task_city, done: !!profile.city },
        { label: t.dashhome_task_photo, done: !!profile.avatar_url },
      ];
      if (profile.role === 'coach') {
        const { data } = await supabase
          .from('coach_profiles')
          .select('bio, specialisms, certifications, price_per_session')
          .eq('id', user.id)
          .maybeSingle();
        setChecklist([
          ...base,
          { label: t.dashhome_task_bio, done: !!data?.bio },
          { label: t.dashhome_task_specialisms, done: !!(data?.specialisms?.length) },
          { label: t.dashhome_task_cert, done: !!(data?.certifications?.length) },
          { label: t.dashhome_task_pricing, done: !!data?.price_per_session },
        ]);
      } else if (profile.role === 'club') {
        const { data } = await supabase
          .from('club_profiles')
          .select('about, sport')
          .eq('id', user.id)
          .maybeSingle();
        setChecklist([
          ...base,
          { label: t.dashhome_task_about, done: !!data?.about },
          { label: t.dashhome_task_sport, done: !!data?.sport },
        ]);
      } else {
        setChecklist(base);
        // Athlete: light stats
        const { data: bookings } = await supabase
          .from('bookings')
          .select('status')
          .eq('athlete_id', user.id);
        const upcoming = bookings?.filter(b => b.status === 'confirmed').length ?? 0;
        const pending = bookings?.filter(b => b.status === 'pending').length ?? 0;
        setAthleteStats(s => ({ ...s, upcoming, pending }));
      }
    })();
  }, [user, profile, t]);

  const completion = Math.round((checklist.filter(c => c.done).length / Math.max(checklist.length, 1)) * 100);

  if (loading || !profile) {
    return <div className="p-8 text-muted-foreground">{t.dashhome_loading}</div>;
  }

  // ─────────────────────────────────────────────────────────
  // ATHLETE VIEW
  // ─────────────────────────────────────────────────────────
  if (role === 'athlete') {
    return (
      <div className="space-y-6 max-w-6xl">
        <div>
          <h1 className="font-display text-3xl">{t.dashhome_welcome}, {firstName}</h1>
          <p className="text-muted-foreground mt-1">{t.dashhome_sub_athlete}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: t.dashhome_upcoming, value: String(athleteStats.upcoming), delta: t.dashhome_confirmed, icon: CalendarCheck },
            { label: t.dashhome_pending, value: String(athleteStats.pending), delta: t.dashhome_awaiting, icon: Inbox },
            { label: t.dashhome_unread, value: String(athleteStats.unread), delta: t.dashhome_from_coaches, icon: MessageSquare },
          ].map(s => (
            <div key={s.label} className="surface p-5">
              <div className="flex items-center justify-between">
                <s.icon className="h-5 w-5 text-gold" />
                <span className="text-xs text-muted-foreground">{s.delta}</span>
              </div>
              <p className="font-display text-2xl mt-3">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="surface p-6 lg:col-span-2">
            <h2 className="font-display text-xl mb-4">{t.dashhome_get_started}</h2>
            <p className="text-sm text-muted-foreground mb-5">
              {t.dashhome_get_started_sub}
            </p>
            <div className="flex flex-wrap gap-2">
              <Link to="/search"><Button><Search className="h-4 w-4 mr-2" /> {t.dashhome_browse_coaches}</Button></Link>
              <Link to="/dashboard/bookings"><Button variant="outline">{t.dashhome_my_bookings}</Button></Link>
              <Link to="/dashboard/messages"><Button variant="outline">{t.dashhome_open_inbox}</Button></Link>
            </div>
          </div>

          <div className="surface p-6">
            <h2 className="font-display text-xl mb-4">{t.dashhome_quick_actions}</h2>
            <div className="space-y-2">
              {[
                { label: t.dashhome_browse_coaches, to: '/search' },
                { label: t.dashhome_my_bookings, to: '/dashboard/bookings' },
                { label: t.dashhome_messages, to: '/dashboard/messages' },
                { label: t.dashhome_settings, to: '/dashboard/settings' },
              ].map(a => (
                <Link key={a.to} to={a.to}>
                  <Button variant="outline" className="w-full justify-between">
                    {a.label} <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // COACH / CLUB VIEW (existing)
  // ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="font-display text-3xl">{t.dashhome_welcome}, {firstName}</h1>
        <p className="text-muted-foreground mt-1">{t.dashhome_sub_coach}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: t.dashhome_profile_views, value: '0', delta: t.dashhome_this_week, icon: Eye },
          { label: t.dashhome_enquiries_received, value: '0', delta: t.dashhome_all_time, icon: MessageSquare },
          { label: t.dashhome_subscription, value: t.dashhome_free_trial, delta: t.dashhome_no_card, icon: Crown },
          { label: t.dashhome_completion, value: `${completion}%`, delta: completion === 100 ? t.dashhome_complete : t.dashhome_keep_going, icon: BadgeCheck },
        ].map(s => (
          <div key={s.label} className="surface p-5">
            <div className="flex items-center justify-between">
              <s.icon className="h-5 w-5 text-gold" />
              <span className="text-xs text-muted-foreground">{s.delta}</span>
            </div>
            <p className="font-display text-2xl mt-3">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl">{t.dashhome_profile_completion}</h2>
            <span className="text-sm font-semibold text-gold">{completion}%</span>
          </div>
          <Progress value={completion} className="h-2" />
          <ul className="mt-5 space-y-2">
            {checklist.map(item => (
              <li key={item.label} className="flex items-center gap-3 text-sm">
                <CheckCircle2 className={`h-4 w-4 ${item.done ? 'text-gold' : 'text-muted-foreground/40'}`} />
                <span className={item.done ? 'text-muted-foreground line-through' : ''}>{item.label}</span>
              </li>
            ))}
          </ul>
          <Link to="/dashboard/profile">
            <Button className="mt-5">{t.dashhome_complete_profile}</Button>
          </Link>
        </div>

        <div className="surface p-6">
          <h2 className="font-display text-xl mb-4">{t.dashhome_quick_actions}</h2>
          <div className="space-y-2">
            {[
              { label: t.dashhome_edit_profile, to: '/dashboard/profile' },
              { label: t.dashhome_upgrade_plan, to: '/dashboard/billing' },
              { label: t.dashhome_open_analytics, to: '/dashboard/analytics' },
              { label: t.dashhome_account_settings, to: '/dashboard/settings' },
            ].map(a => (
              <Link key={a.to} to={a.to}>
                <Button variant="outline" className="w-full justify-between">
                  {a.label} <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="surface p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl">{t.dashhome_recent_enquiries}</h2>
        </div>
        <div className="py-10 flex flex-col items-center text-center text-muted-foreground">
          <Inbox className="h-8 w-8 mb-3 text-muted-foreground/50" />
          <p className="text-sm">{t.dashhome_no_enquiries}</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
