import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Eye, MessageSquare, BadgeCheck, Crown, ChevronRight, Inbox, CheckCircle2, CalendarCheck, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const DashboardHome = () => {
  const { user, profile } = useAuth();
  const firstName = (profile?.full_name || '').trim().split(' ')[0] || 'there';
  const role = profile?.role;

  const [checklist, setChecklist] = useState<{ label: string; done: boolean }[]>([]);
  const [athleteStats, setAthleteStats] = useState({ upcoming: 0, pending: 0, unread: 0 });

  useEffect(() => {
    if (!user || !profile) return;
    (async () => {
      const base = [
        { label: 'Add your full name', done: !!profile.full_name },
        { label: 'Set your city', done: !!profile.city },
        { label: 'Add a profile photo', done: !!profile.avatar_url },
      ];
      if (profile.role === 'coach') {
        const { data } = await supabase
          .from('coach_profiles')
          .select('bio, specialisms, certifications, price_per_session')
          .eq('id', user.id)
          .maybeSingle();
        setChecklist([
          ...base,
          { label: 'Write your bio', done: !!data?.bio },
          { label: 'List your specialisms', done: !!(data?.specialisms?.length) },
          { label: 'Add at least one certification', done: !!(data?.certifications?.length) },
          { label: 'Set your pricing', done: !!data?.price_per_session },
        ]);
      } else if (profile.role === 'club') {
        const { data } = await supabase
          .from('club_profiles')
          .select('about, sport')
          .eq('id', user.id)
          .maybeSingle();
        setChecklist([
          ...base,
          { label: 'Write an about section', done: !!data?.about },
          { label: 'Set your primary sport', done: !!data?.sport },
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
  }, [user, profile]);

  const completion = Math.round((checklist.filter(c => c.done).length / Math.max(checklist.length, 1)) * 100);

  // ─────────────────────────────────────────────────────────
  // ATHLETE VIEW
  // ─────────────────────────────────────────────────────────
  if (role === 'athlete') {
    return (
      <div className="space-y-6 max-w-6xl">
        <div>
          <h1 className="font-display text-3xl">Welcome back, {firstName}</h1>
          <p className="text-muted-foreground mt-1">Your training at a glance.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: 'Upcoming sessions', value: String(athleteStats.upcoming), delta: 'Confirmed', icon: CalendarCheck },
            { label: 'Pending requests', value: String(athleteStats.pending), delta: 'Awaiting coach', icon: Inbox },
            { label: 'Unread messages', value: String(athleteStats.unread), delta: 'From coaches', icon: MessageSquare },
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
            <h2 className="font-display text-xl mb-4">Get started</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Find a verified coach in Nice, Monaco or Sofia and book your first session.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link to="/search"><Button><Search className="h-4 w-4 mr-2" /> Browse coaches</Button></Link>
              <Link to="/dashboard/bookings"><Button variant="outline">My bookings</Button></Link>
              <Link to="/dashboard/messages"><Button variant="outline">Open inbox</Button></Link>
            </div>
          </div>

          <div className="surface p-6">
            <h2 className="font-display text-xl mb-4">Quick actions</h2>
            <div className="space-y-2">
              {[
                { label: 'Browse coaches', to: '/search' },
                { label: 'My bookings', to: '/dashboard/bookings' },
                { label: 'Messages', to: '/dashboard/messages' },
                { label: 'Settings', to: '/dashboard/settings' },
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
        <h1 className="font-display text-3xl">Welcome back, {firstName}</h1>
        <p className="text-muted-foreground mt-1">Here's a snapshot of your account.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Profile views', value: '0', delta: 'This week', icon: Eye },
          { label: 'Enquiries received', value: '0', delta: 'All time', icon: MessageSquare },
          { label: 'Subscription', value: 'Free trial', delta: 'No card on file', icon: Crown },
          { label: 'Completion', value: `${completion}%`, delta: completion === 100 ? 'Complete' : 'Keep going', icon: BadgeCheck },
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
            <h2 className="font-display text-xl">Profile completion</h2>
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
            <Button className="mt-5">Complete profile</Button>
          </Link>
        </div>

        <div className="surface p-6">
          <h2 className="font-display text-xl mb-4">Quick actions</h2>
          <div className="space-y-2">
            {[
              { label: 'Edit profile', to: '/dashboard/profile' },
              { label: 'Upgrade plan', to: '/dashboard/billing' },
              { label: 'Open analytics', to: '/dashboard/analytics' },
              { label: 'Account settings', to: '/dashboard/settings' },
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
          <h2 className="font-display text-xl">Recent enquiries</h2>
        </div>
        <div className="py-10 flex flex-col items-center text-center text-muted-foreground">
          <Inbox className="h-8 w-8 mb-3 text-muted-foreground/50" />
          <p className="text-sm">No enquiries yet — they'll show up here once athletes reach out.</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
