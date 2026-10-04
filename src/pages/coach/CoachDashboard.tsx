import { useStaffPaths, useStaffRole } from '@/context/StaffRoleContext';
import { classFill, clubSummary, resourceOccupancy } from '@/lib/sessionMetrics';
import { useClubResources, useWeekResourceSessions } from '@/hooks/coach/useClubResources';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Plus } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { CountUp } from '@/components/CountUp';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { sessionFill, useCoachTz, useSessionStatus, type CalSession } from '@/hooks/coach/useCoachCalendar';
import { useToggleTask, BOARD_STAGES } from '@/hooks/coach/useCoachClients';
import { MobileTodayCards } from '@/components/coach/dashboard/MobileTodayCards';
import { useCoachDashboard, useCoachInbox, useQuickTask } from '@/hooks/coach/useCoachDashboard';
import { useUnreadCount } from '@/hooks/coach/useUnreadCount';
import { SessionSheet } from '@/components/coach/calendar/SessionSheet';
import { Avatar, LOCALES, portalInput, portalLabel, stageKey } from '@/components/coach/clients/shared';
import { labelDate, todayStr, toTimeStr, zonedParts } from '@/lib/tz';

const card = 'animate-fade-up-in bg-portal-card border border-portal-border rounded-[4px] p-5';
const title = 'font-display uppercase tracking-[0.1em] text-base text-portal-ink';
const link = 'text-sm text-portal-blue hover:underline';

export default function CoachDashboard() {
  const { t, lang } = useLanguage();
  const { base, peoplePath } = useStaffPaths();
  const isClub = useStaffRole() === 'club';
  const { profile } = useAuth();
  const tz = useCoachTz();
  const locale = LOCALES[lang];
  const { data, isLoading } = useCoachDashboard();
  const { data: resources } = useClubResources();
  const { data: weekRes } = useWeekResourceSessions();
  const [selected, setSelected] = useState<CalSession | null>(null);

  const activeRes = (resources ?? []).filter((r) => r.active);
  const occRows = activeRes.map((r) => ({ r, occ: weekRes ? resourceOccupancy(r, weekRes.sessions.filter((s) => s.resource_id === r.id), weekRes.start, weekRes.end) : null }));
  const avgOcc = activeRes.length && weekRes ? Math.round(occRows.reduce((n, o) => n + (o.occ?.percentage ?? 0), 0) / activeRes.length) : null;

  const today = todayStr(tz);
  const h = zonedParts(new Date(), tz).h;
  const greet = h < 12 ? t.dash_morning : h < 18 ? t.dash_afternoon : t.dash_evening;
  const first = (profile?.full_name || '').split(' ')[0];
  const dateLine = labelDate(today, locale, { weekday: 'short', day: '2-digit', month: 'short' }).replace(/[.,]/g, '').toUpperCase();

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      <div className="flex-1 min-w-0 space-y-6">
        <header className="hidden md:block">
          <p className={portalLabel}>{dateLine}</p>
          <h1 className="font-display uppercase text-3xl tracking-[0.06em] text-portal-ink mt-1">{greet}{first ? `, ${first}` : ''}</h1>
          {isLoading ? <Skeleton className="h-4 w-72 mt-2" /> : data && (
            <p className="text-sm text-portal-muted-strong mt-1">
              {isClub
                ? t.dash_sum_club
                    .replace('{n}', String(clubSummary(data.todaySessions).classes))
                    .replace('{h}', String(clubSummary(data.todaySessions).hires))
                    .replace('{e}', String(data.newEnquiries))
                : `${data.todaySessions.filter((s) => s.status !== 'cancelled').length} ${t.dash_sum_sessions} · ${data.tasksDue} ${t.dash_sum_tasks} · ${data.newEnquiries} ${t.dash_sum_enquiries}`}
            </p>
          )}
        </header>

        <div className="md:hidden space-y-6">
          <div>
            <p className={portalLabel}>{dateLine}</p>
            <h1 className="font-display uppercase text-2xl tracking-[0.06em] text-portal-ink mt-1">{t.dash_today}</h1>
          </div>
          {isLoading || !data ? <div className="space-y-3"><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
            : data.todaySessions.length === 0 ? <p className="text-sm text-portal-muted bg-portal-card border border-portal-border rounded-[4px] p-5">{t.dash_today_empty}</p>
            : <MobileTodayCards sessions={data.todaySessions} />}
          <TasksCard loading={isLoading} tasks={data?.tasks ?? []} today={today} locale={locale} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {isLoading || !data ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />) : isClub ? (
            <>
              <Kpi label={t.dash_kpi_active} value={String(data.activeClients)} sub={`+${data.activeNewMonth} ${t.dash_this_month}`} />
              <Kpi label={t.dash_kpi_classes} value={String(classFill(data.weekSessions).classes)} sub={t.dash_kpi_classes_sub.replace('{fill}', String(classFill(data.weekSessions).fill))} />
              <Kpi label={t.dash_kpi_occupancy} value={avgOcc === null ? '—' : `${avgOcc}%`} sub={t.dash_this_week} />
              <Kpi label={t.dash_kpi_hires} value={String(clubSummary(data.weekSessions).hires)} sub={t.dash_this_week} />
            </>
          ) : (
            <>
              <Kpi label={t.dash_kpi_sessions} value={String(data.sessionsWeek)} sub={`${data.sessionsDelta >= 0 ? '+' : ''}${data.sessionsDelta} ${t.dash_vs_last_week}`} />
              <Kpi label={t.dash_kpi_active} value={String(data.activeClients)} sub={`+${data.activeNewMonth} ${t.dash_this_month}`} />
              <Kpi label={t.dash_kpi_attendance} value={data.attendance === null ? '—' : `${data.attendance}%`} sub={t.dash_last_30} />
              <Kpi label={t.dash_kpi_hours} value={String(data.hours)} sub={t.dash_this_week} />
            </>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <section className={`${card} lg:col-span-2 hidden md:block`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className={title}>{t.dash_today}</h2>
              <Link to={`${base}/calendar`} className={link}>{t.dash_open_calendar} →</Link>
            </div>
            {isLoading || !data ? <div className="space-y-2"><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
              : data.todaySessions.length === 0 ? <p className="text-sm text-portal-muted py-4">{t.dash_today_empty}</p>
              : <TodayList sessions={data.todaySessions} onOpen={setSelected} />}
          </section>

          <section className={card}>
            <div className="flex items-center justify-between mb-3">
              <h2 className={title}>{t.dash_pipeline}</h2>
              <Link to={peoplePath} className={link}>{t.dash_open_board} →</Link>
            </div>
            {isLoading || !data ? <Skeleton className="h-32" /> : (
              <div className="space-y-3">
                {BOARD_STAGES.map((s) => {
                  const max = Math.max(1, ...Object.values(data.pipeline));
                  return (
                    <div key={s}>
                      <div className="flex justify-between text-sm"><span>{t[stageKey(s)]}</span><span className="font-display">{data.pipeline[s]}</span></div>
                      <div className="h-2 bg-portal-bg rounded-[2px] mt-1"><div className="h-2 bg-portal-blue animate-grow-in rounded-[2px]" style={{ width: `${(data.pipeline[s] / max) * 100}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {isClub && (
            <section className={card}>
              <div className="flex items-center justify-between mb-3">
                <h2 className={title}>{t.dash_occ_title}</h2>
                <Link to={`${base}/facilities`} className={link}>{t.dash_occ_link}</Link>
              </div>
              {isLoading || !data ? <Skeleton className="h-32" /> : activeRes.length === 0 ? (
                <p className="text-sm text-portal-muted py-2">{t.fac_empty} <Link to={`${base}/facilities`} className={link}>{t.dash_occ_link}</Link></p>
              ) : (
                <div className="space-y-3">
                  {occRows.map(({ r, occ }) => (
                    <div key={r.id}>
                      <div className="flex justify-between text-sm"><span className="truncate">{r.name}</span><span className="font-display">{occ ? `${occ.percentage}%` : '—'}</span></div>
                      <div className="h-2 bg-portal-bg rounded-[2px] mt-1"><div className="h-2 bg-portal-blue animate-grow-in rounded-[2px]" style={{ width: `${occ?.percentage ?? 0}%` }} /></div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          <TasksCard className="hidden md:block" loading={isLoading} tasks={data?.tasks ?? []} today={today} locale={locale} />

          {!isClub && (
          <section className={`${card} lg:col-span-2`}>
            <h2 className={`${title} mb-3`}>{t.dash_per_week}</h2>
            {isLoading || !data ? <Skeleton className="h-56" /> : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.perWeek.map((w) => ({ ...w, label: labelDate(w.week, locale, { day: '2-digit', month: 'short' }) }))}>
                    <CartesianGrid vertical={false} stroke="hsl(var(--portal-border))" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--portal-muted))' }} />
                    <YAxis allowDecimals={false} domain={[0, 'auto']} tickLine={false} axisLine={false} width={28} tick={{ fontSize: 11, fill: 'hsl(var(--portal-muted))' }} />
                    <Tooltip cursor={{ fill: 'hsl(var(--portal-bg))' }} content={({ active, payload }) => active && payload?.length ? (
                      <div className="bg-portal-card border border-portal-border rounded-[4px] px-2 py-1 text-xs">
                        {t.dash_tooltip.replace('{date}', (payload[0].payload as any).label).replace('{n}', String(payload[0].value))}
                      </div>
                    ) : null} />
                    <Bar dataKey="count" fill="hsl(var(--portal-blue))" animationDuration={800} animationEasing="ease-out" isAnimationActive={!window.matchMedia('(prefers-reduced-motion: reduce)').matches} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        </div>
      </div>

      <Inbox />
      <SessionSheet session={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="motion-card bg-portal-card border border-portal-border rounded-[4px] p-4">
      <p className={portalLabel}>{label}</p>
      <p className="font-display text-4xl text-portal-ink mt-1 leading-none"><CountUp value={value} /></p>
      <p className="text-xs text-portal-muted mt-2">{sub}</p>
    </div>
  );
}

function TodayList({ sessions, onOpen }: { sessions: CalSession[]; onOpen: (s: CalSession) => void }) {
  const { t } = useLanguage();
  const { base, peoplePath } = useStaffPaths();
  const tz = useCoachTz();
  const setStatus = useSessionStatus();
  const now = Date.now();
  const nextId = sessions.find((s) => s.status === 'scheduled' && new Date(s.starts_at).getTime() >= now)?.id;
  const chip = (s: CalSession) => {
    if (s.status === 'attended') return [t.dash_chip_done, 'bg-portal-bg text-portal-success'];
    if (s.status === 'no_show') return [t.dash_chip_noshow, 'bg-portal-bg text-portal-coral-text'];
    if (s.status === 'cancelled') return [t.dash_chip_cancelled, 'bg-portal-bg text-portal-muted line-through'];
    if (s.id === nextId) return [t.dash_chip_next, 'bg-portal-selected text-portal-ink border border-portal-selected-border'];
    if (s.kind === 'trial') return [t.dash_chip_trial, 'bg-portal-copper-tint text-portal-ink border border-portal-copper'];
    return ['', ''];
  };
  return (
    <ul className="divide-y divide-portal-border">
      {sessions.map((s) => {
        const [label, cls] = chip(s);
        const past = s.status === 'scheduled' && new Date(s.starts_at).getTime() <= now;
        const dot = s.status === 'attended' ? 'bg-portal-muted' : s.id === nextId ? 'bg-portal-copper' : s.status === 'scheduled' ? 'bg-portal-blue' : 'bg-portal-border';
        return (
          <li key={s.id} className="flex items-center gap-3 py-2.5">
            <button onClick={() => onOpen(s)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
              <span className="font-display text-lg w-14 text-portal-ink">{toTimeStr(s.starts_at, tz)}</span>
              <span className={`w-2 h-2 rounded-full ${dot}`} />
              <span className="min-w-0">
                <span className={`block truncate ${s.status === 'cancelled' ? 'line-through text-portal-muted' : 'text-portal-ink'}`}>{s.capacity != null ? `${s.title || t.group_type} · ${sessionFill(s)}/${s.capacity}` : s.client?.display_name ?? '—'}</span>
                <span className="block text-xs text-portal-muted truncate">{s.capacity != null ? t.group_type : s.kind === 'trial' ? t.dash_chip_trial : t.dash_session}{s.location ? ` · ${s.location}` : ''}</span>
              </span>
            </button>
            {past && s.capacity == null && (
              <button disabled={setStatus.isPending} onClick={() => setStatus.mutate({ id: s.id, status: 'attended' }, { onError: () => toast.error(t.crm_error) })}
                className="text-xs h-8 px-2.5 border border-portal-border rounded-[4px] hover:bg-portal-bg inline-flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />{t.dash_mark_attended}
              </button>
            )}
            {label && <span className={`text-[11px] font-display uppercase tracking-[0.08em] px-2 py-0.5 rounded-[4px] ${cls}`}>{label}</span>}
          </li>
        );
      })}
    </ul>
  );
}

function TasksCard({ loading, tasks, today, locale, className = '' }: { loading: boolean; tasks: any[]; today: string; locale: string; className?: string }) {
  const { t } = useLanguage();
  const { base, peoplePath } = useStaffPaths();
  const toggle = useToggleTask();
  const add = useQuickTask();
  const [draft, setDraft] = useState('');
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = draft.trim().slice(0, 200);
    if (!v) return;
    add.mutate(v, { onSuccess: () => setDraft(''), onError: () => toast.error(t.crm_error) });
  };
  return (
    <section className={`${card} ${className}`}>
      <div className="flex items-center justify-between mb-3"><h2 className={title}>{t.dash_tasks}</h2></div>
      {loading ? <Skeleton className="h-32" /> : tasks.length === 0 ? <p className="text-sm text-portal-muted py-2">{t.dash_tasks_empty}</p> : (
        <ul className="space-y-2">
          {tasks.map((k) => {
            const overdue = k.due_date && k.due_date < today;
            return (
              <li key={k.id} className="flex items-start gap-2.5 text-sm">
                <input type="checkbox" className="mt-1 accent-portal-blue" checked={false}
                  onChange={() => toggle.mutate({ id: k.id, done: true }, { onError: () => toast.error(t.crm_error) })} />
                <span className="flex-1 min-w-0">
                  <span className="block text-portal-ink">{k.title}</span>
                  <span className="text-xs text-portal-muted">
                    {k.due_date && <span className={overdue ? 'text-portal-coral-text' : ''}>{labelDate(k.due_date, locale, { day: '2-digit', month: 'short' })}</span>}
                    {k.due_date && k.client && ' · '}
                    {k.client && <Link to={`${peoplePath}/${k.client.id}`} className="hover:underline">{k.client.display_name}</Link>}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <form onSubmit={submit} className="flex gap-2 mt-3">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t.dash_add_task} className={`${portalInput} flex-1`} maxLength={200} />
        <button type="submit" aria-label={t.dash_add_task} disabled={add.isPending} className="h-10 w-10 inline-flex items-center justify-center border border-portal-border rounded-[4px] hover:bg-portal-bg"><Plus className="w-4 h-4" /></button>
      </form>
    </section>
  );
}

function Inbox() {
  const { t, lang } = useLanguage();
  const { base, peoplePath } = useStaffPaths();
  const tz = useCoachTz();
  const { data, isLoading } = useCoachInbox();
  const { byConvo } = useUnreadCount();
  const today = todayStr(tz);
  const when = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(LOCALES[lang], { timeZone: tz }) === new Date().toLocaleDateString(LOCALES[lang], { timeZone: tz })
      ? toTimeStr(iso, tz)
      : d.toLocaleDateString(LOCALES[lang], { timeZone: tz, day: '2-digit', month: 'short' });
  };
  void today;
  return (
    <aside className={`${card} xl:w-[340px] xl:shrink-0 self-start`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className={title}>{t.dash_inbox_title}</h2>
        <Link to={`${base}/messages`} className={link}>{t.dash_open_messages} →</Link>
      </div>
      {isLoading ? <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        : !data?.length ? <p className="text-sm text-portal-muted">{t.dash_inbox_empty}</p>
        : (
          <ul className="divide-y divide-portal-border">
            {data.map((c) => (
              <li key={c.id}>
                <Link to={`${base}/messages?c=${c.id}`} className="flex items-center gap-3 py-2.5 hover:bg-portal-bg -mx-2 px-2 rounded-[4px]">
                  <Avatar name={c.name} size={36} />
                  <span className="flex-1 min-w-0">
                    <span className="flex justify-between gap-2"><span className="truncate text-portal-ink text-sm">{c.name}</span><span className="text-xs text-portal-muted shrink-0">{when(c.last_message_at)}</span></span>
                    <span className="flex items-center gap-2"><span className="block truncate text-xs text-portal-muted flex-1">{c.preview ?? ''}</span>{byConvo.has(c.id) && <span aria-label={t.cmsg_unread} className="w-2 h-2 rounded-full bg-portal-blue shrink-0" />}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
    </aside>
  );
}
