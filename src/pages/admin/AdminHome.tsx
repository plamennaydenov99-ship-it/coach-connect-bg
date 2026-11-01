import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { rpc } from '@/lib/trending';
import { PublicNav } from '@/components/layout/PublicNav';
import { AdminNav } from '@/components/admin/AdminNav';
import { CountUp } from '@/components/CountUp';

type Overview = {
  people: { total: number; athletes: number; coaches: number; clubs: number; new_7d: number; unconfirmed: number };
  waiting: { coach_apps: number; club_apps: number; certificates: number; boosts: number };
  activity: { upcoming_sessions: number; bookings_7d: number; spot_requests_7d: number; messages_7d: number; profile_views_7d: number };
  signups_14d: { d: string; n: number }[];
};
type AuditRow = { id: string; action: string; target_label: string | null; created_at: string };

const ACTION_LABEL: Record<string, string> = { delete_user: 'Deleted account' };
const fmtDay = (d?: string) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '');

function Big({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-background-secondary p-5">
      <p className="font-display text-5xl font-extrabold leading-none"><CountUp value={String(value)} /></p>
      <p className="mt-3 text-sm text-foreground-muted">{label}</p>
    </div>
  );
}

function Todo({ to, value, label }: { to: string; value: number; label: string }) {
  const hot = value > 0;
  return (
    <Link
      to={to}
      className={`block p-5 transition-transform duration-500 ease-out hover:-translate-y-1 ${hot ? 'bg-accent text-white' : 'bg-background-secondary text-foreground'}`}
    >
      <p className="font-display text-6xl font-extrabold leading-none" style={{ color: 'inherit' }}><CountUp value={String(value)} /></p>
      <p className={`mt-3 text-sm ${hot ? 'text-white/90' : 'text-foreground-muted'}`}>{label}</p>
    </Link>
  );
}

export default function AdminHome() {
  const { user, profile, loading, profileLoading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<Overview | null>(null);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = !!profile?.is_admin;

  useEffect(() => {
    if (loading || profileLoading) return;
    if (!user || !isAdmin) { navigate('/', { replace: true }); return; }
    (async () => {
      const { data: d, error: e } = await rpc<Overview>('admin_overview');
      if (e) setError(e.message); else setData(d);
      const { data: a } = await (supabase as unknown as { from: (t: string) => { select: (c: string) => { order: (c: string, o: object) => { limit: (n: number) => PromiseLike<{ data: AuditRow[] | null }> } } } })
        .from('admin_audit_log').select('id, action, target_label, created_at').order('created_at', { ascending: false }).limit(8);
      setAudit(a ?? []);
    })();
  }, [loading, profileLoading, user, isAdmin, navigate]);

  if (loading || profileLoading || !user || !isAdmin) return null;

  const peak = Math.max(1, ...(data?.signups_14d ?? []).map(s => s.n));

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="container max-w-5xl py-12">
        <h1 className="text-5xl md:text-6xl">Control room</h1>
        <p className="mt-2 mb-8 text-foreground-muted">What is happening on Lokka, and what is waiting for you.</p>
        <AdminNav />

        {error ? (
          <p className="text-sm text-destructive">Could not load the overview: {error}</p>
        ) : !data ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-foreground-muted" /></div>
        ) : (
          <div className="space-y-14">
            <section>
              <h2 className="mb-4 text-2xl">Waiting for you</h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Todo to="/admin/review" value={data.waiting.coach_apps} label="Coach applications" />
                <Todo to="/admin/users?role=club" value={data.waiting.club_apps} label="Club applications" />
                <Todo to="/admin/review" value={data.waiting.certificates} label="Documents to check" />
                <Todo to="/admin/trending" value={data.waiting.boosts} label="Boosts to review" />
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-2xl">People</h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <Big value={data.people.total} label="Registered" />
                <Big value={data.people.athletes} label="Athletes" />
                <Big value={data.people.coaches} label="Coaches" />
                <Big value={data.people.clubs} label="Clubs" />
                <Big value={data.people.new_7d} label="Joined in the last 7 days" />
                <Big value={data.people.unconfirmed} label="Never confirmed their email" />
              </div>

              <div className="mt-3 bg-background-secondary p-5">
                <p className="text-sm text-foreground-muted">Sign-ups, last 14 days</p>
                <div className="mt-4 flex h-24 items-end gap-1.5" role="img" aria-label="Sign-ups per day for the last 14 days">
                  {data.signups_14d.map(s => (
                    <div key={s.d} className="flex h-full flex-1 flex-col items-center justify-end" title={`${fmtDay(s.d)}: ${s.n}`}>
                      <div className={s.n > 0 ? 'w-full bg-primary' : 'w-full bg-foreground/15'} style={{ height: `${Math.max(4, (s.n / peak) * 100)}%` }} />
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-xs text-foreground-muted">
                  <span>{fmtDay(data.signups_14d[0]?.d)}</span><span>{fmtDay(data.signups_14d[data.signups_14d.length - 1]?.d)}</span>
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-2xl">Activity</h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                <Big value={data.activity.upcoming_sessions} label="Public sessions coming up" />
                <Big value={data.activity.bookings_7d} label="Bookings, 7 days" />
                <Big value={data.activity.spot_requests_7d} label="Spot requests, 7 days" />
                <Big value={data.activity.messages_7d} label="Messages, 7 days" />
                <Big value={data.activity.profile_views_7d} label="Profile views, 7 days" />
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-2xl">Recent admin actions</h2>
              {audit.length === 0 ? (
                <p className="text-sm text-foreground-muted">Nothing yet. Deleting an account from the People page is logged here.</p>
              ) : (
                <ul className="divide-y divide-border bg-background-secondary">
                  {audit.map(a => (
                    <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                      <span>{ACTION_LABEL[a.action] ?? a.action}{a.target_label ? ` · ${a.target_label}` : ''}</span>
                      <span className="text-foreground-muted">{new Date(a.created_at).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
