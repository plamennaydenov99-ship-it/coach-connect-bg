import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Phone, Mail, Send, Plus } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useLanguage } from '@/context/LanguageContext';
import {
  ALL_STAGES, useAddNote, useAddTask, useClientDetail, useDeleteClient, useMoveClient,
  useSetSessionStatus, useToggleTask, useUpdateClient, type CoachSession,
} from '@/hooks/coach/useCoachClients';
import { Avatar, fmtDate, fmtDateTime, portalBtnGhost, portalBtnPrimary, portalInput, portalLabel, stageKey } from './shared';
import { toast } from 'sonner';

type TimelineItem = { id: string; at: string; label: string; text: string };

const statusChip: Record<string, string> = {
  scheduled: 'border-portal-selected-border bg-portal-selected text-portal-ink',
  attended: 'border-portal-border bg-portal-bg text-portal-ink',
  no_show: 'border-portal-copper text-portal-copper',
  cancelled: 'border-portal-border text-portal-muted line-through',
};

export function ClientDrawer({ clientId, onClose }: { clientId: string | undefined; onClose: () => void }) {
  const { t } = useLanguage();
  const { data, isLoading } = useClientDetail(clientId);
  const c = data?.client;

  return (
    <Sheet open={!!clientId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="coach-portal w-full sm:max-w-[420px] p-0 bg-portal-card border-portal-border flex flex-col gap-0 overflow-hidden">
        <SheetTitle className="sr-only">{c?.display_name ?? t.crm_clients}</SheetTitle>
        <SheetDescription className="sr-only">{t.crm_clients}</SheetDescription>
        {isLoading ? (
          <div className="p-5 space-y-3"><Skeleton className="h-12 w-2/3" /><Skeleton className="h-20 w-full" /><Skeleton className="h-40 w-full" /></div>
        ) : !c || !data ? (
          <div className="p-6 text-sm text-portal-muted">{t.crm_not_found}</div>
        ) : (
          <DrawerBody key={c.id} data={data} onDeleted={onClose} />
        )}
      </SheetContent>
    </Sheet>
  );
}

function DrawerBody({ data, onDeleted }: { data: NonNullable<ReturnType<typeof useClientDetail>['data']>; onDeleted: () => void }) {
  const { t, lang } = useLanguage();
  const c = data.client!;
  const move = useMoveClient();
  const update = useUpdateClient();
  const [goal, setGoal] = useState(c.goal ?? '');
  useEffect(() => setGoal(c.goal ?? ''), [c.goal]);

  const now = Date.now();
  const attended = data.sessions.filter((s) => s.status === 'attended').length;
  const noShow = data.sessions.filter((s) => s.status === 'no_show').length;
  const next = [...data.sessions]
    .filter((s) => s.status === 'scheduled' && new Date(s.starts_at).getTime() >= now)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0];

  const saveGoal = () => {
    if ((c.goal ?? '') === goal.trim()) return;
    update.mutate({ id: c.id, goal: goal.trim().slice(0, 300) || null }, { onError: () => toast.error(t.crm_error) });
  };

  const changeStage = (stage: string) => {
    if (stage === c.stage) return;
    move.move(c.id, stage).catch(() => toast.error(t.crm_error));
  };

  return (
    <>
      <div className="p-5 pr-12 border-b border-portal-border space-y-3">
        <div className="flex items-center gap-3">
          <Avatar name={c.display_name} size={44} />
          <div className="min-w-0 flex-1">
            <div className="font-display text-xl uppercase tracking-[0.06em] text-portal-ink truncate">{c.display_name}</div>
            <div className="text-xs text-portal-muted">{t.crm_since} {fmtDate(c.created_at, lang)}</div>
          </div>
          <select value={c.stage} onChange={(e) => changeStage(e.target.value)} className="h-8 px-2 rounded-[4px] border border-portal-selected-border bg-portal-selected text-portal-ink text-sm" aria-label={t.crm_stage}>
            {ALL_STAGES.map((s) => <option key={s} value={s}>{t[stageKey(s)]}</option>)}
          </select>
        </div>
        <input
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          onBlur={saveGoal}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          placeholder={t.crm_goal_ph}
          aria-label={t.crm_goal}
          className="w-full text-sm bg-transparent border border-transparent hover:border-portal-border focus:border-portal-copper focus:outline-none rounded-[4px] px-2 py-1 -mx-2 text-portal-ink placeholder:text-portal-muted"
        />
        <div className="grid grid-cols-3 gap-2">
          <Stat label={t.crm_sessions} value={String(data.sessions.length)} />
          <Stat label={t.crm_attendance} value={attended + noShow ? `${attended}/${attended + noShow}` : '—'} />
          <Stat label={t.crm_next_session} value={next ? fmtDateTime(next.starts_at, lang) : '—'} small />
        </div>
        {(c.phone || c.email) && (
          <div className="rounded-[4px] border border-portal-border bg-portal-bg p-3 space-y-1.5">
            <div className={`${portalLabel} inline-flex items-center gap-1`}><Lock className="h-3 w-3" />{t.crm_private_only_you}</div>
            {c.phone && <a href={`tel:${c.phone}`} className="flex items-center gap-2 text-sm text-portal-ink"><Phone className="h-3.5 w-3.5 text-portal-muted" />{c.phone}</a>}
            {c.email && <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-sm text-portal-ink break-all"><Mail className="h-3.5 w-3.5 text-portal-muted" />{c.email}</a>}
          </div>
        )}
      </div>

      <Tabs defaultValue="timeline" className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-5 mt-3 grid grid-cols-4 bg-portal-bg rounded-[4px] h-9 p-0.5">
          {(['timeline', 'tasks', 'sessions', 'details'] as const).map((k) => (
            <TabsTrigger key={k} value={k} className="rounded-[4px] text-xs font-display uppercase tracking-[0.08em] text-portal-muted-strong data-[state=active]:bg-portal-card data-[state=active]:text-portal-ink data-[state=active]:shadow-none">
              {t[`crm_tab_${k}` as const]}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="flex-1 overflow-y-auto">
          <TabsContent value="timeline" className="m-0"><TimelineTab data={data} /></TabsContent>
          <TabsContent value="tasks" className="m-0 p-5"><TasksTab clientId={c.id} tasks={data.tasks} /></TabsContent>
          <TabsContent value="sessions" className="m-0 p-5"><SessionsTab clientId={c.id} sessions={data.sessions} /></TabsContent>
          <TabsContent value="details" className="m-0 p-5"><DetailsTab client={c} onDeleted={onDeleted} /></TabsContent>
        </div>
      </Tabs>
    </>
  );
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="rounded-[4px] border border-portal-border p-2">
      <div className={portalLabel}>{label}</div>
      <div className={`${small ? 'text-xs' : 'text-lg font-display'} text-portal-ink mt-0.5`}>{value}</div>
    </div>
  );
}

function TimelineTab({ data }: { data: NonNullable<ReturnType<typeof useClientDetail>['data']> }) {
  const { t, lang } = useLanguage();
  const addNote = useAddNote(data.client!.id);
  const [note, setNote] = useState('');

  const items = useMemo<TimelineItem[]>(() => {
    const out: TimelineItem[] = [];
    data.notes.forEach((n) => out.push({ id: `n${n.id}`, at: n.created_at, label: t.crm_type_note, text: n.content }));
    data.sessions.forEach((s) =>
      out.push({ id: `s${s.id}`, at: s.starts_at, label: t.crm_type_session, text: `${fmtDateTime(s.starts_at, lang)} · ${t[`crm_status_${s.status}` as 'crm_status_scheduled']}${s.kind === 'trial' ? ` · ${t.crm_trial}` : ''}` }),
    );
    data.tasks.forEach((k) => {
      out.push({ id: `tc${k.id}`, at: k.created_at, label: t.crm_type_task_created, text: k.title });
      if (k.done && k.done_at) out.push({ id: `td${k.id}`, at: k.done_at, label: t.crm_type_task_done, text: k.title });
    });
    data.events.forEach((e) => {
      const p = (e.payload ?? {}) as { from?: string; to?: string };
      out.push({ id: `e${e.id}`, at: e.created_at, label: t.crm_type_stage, text: `${p.from ? t[stageKey(p.from) as 'crm_stage_enquiry'] : '—'} → ${p.to ? t[stageKey(p.to) as 'crm_stage_enquiry'] : '—'}` });
    });
    return out.sort((a, b) => b.at.localeCompare(a.at));
  }, [data, t, lang]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = note.trim().slice(0, 2000);
    if (!v) return;
    addNote.mutate(v, { onSuccess: () => setNote(''), onError: () => toast.error(t.crm_error) });
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 p-5 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-portal-muted">{t.crm_no_timeline}</p>
        ) : (
          items.map((i) => (
            <div key={i.id} className="border-l-2 border-portal-border pl-3">
              <div className="flex items-center gap-2">
                <span className={portalLabel}>{i.label}</span>
                <span className="text-[11px] text-portal-muted">{fmtDate(i.at, lang)}</span>
              </div>
              <p className="text-sm text-portal-ink whitespace-pre-wrap break-words">{i.text}</p>
            </div>
          ))
        )}
      </div>
      <form onSubmit={submit} className="sticky bottom-0 p-3 border-t border-portal-border bg-portal-card flex gap-2">
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t.crm_add_note_ph} className={portalInput} maxLength={2000} />
        <button type="submit" className={portalBtnPrimary} disabled={!note.trim() || addNote.isPending} aria-label={t.crm_add}><Send className="h-4 w-4" /></button>
      </form>
    </div>
  );
}

function TasksTab({ clientId, tasks }: { clientId: string; tasks: NonNullable<ReturnType<typeof useClientDetail>['data']>['tasks'] }) {
  const { t, lang } = useLanguage();
  const add = useAddTask(clientId);
  const toggle = useToggleTask();
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const todayStr = new Date().toISOString().slice(0, 10);
  const sorted = [...tasks].sort((a, b) => Number(a.done) - Number(b.done) || (a.due_date ?? '9').localeCompare(b.due_date ?? '9'));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = title.trim().slice(0, 200);
    if (!v) return;
    add.mutate({ title: v, due_date: due || null }, { onSuccess: () => { setTitle(''); setDue(''); }, onError: () => toast.error(t.crm_error) });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="flex gap-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t.crm_task_title_ph} className={portalInput} maxLength={200} />
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={`${portalInput} w-[140px]`} aria-label={t.crm_due} />
        <button type="submit" className={portalBtnPrimary} disabled={!title.trim() || add.isPending} aria-label={t.crm_add}><Plus className="h-4 w-4" /></button>
      </form>
      {sorted.length === 0 ? (
        <p className="text-sm text-portal-muted">{t.crm_no_tasks}</p>
      ) : (
        <ul className="space-y-1">
          {sorted.map((k) => {
            const overdue = !k.done && k.due_date && k.due_date < todayStr;
            return (
              <li key={k.id} className="flex items-start gap-2 py-1.5">
                <input type="checkbox" checked={k.done} onChange={(e) => toggle.mutate({ id: k.id, done: e.target.checked }, { onError: () => toast.error(t.crm_error) })} className="mt-1 h-4 w-4 accent-[hsl(var(--portal-copper))]" />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm ${k.done ? 'line-through text-portal-muted' : 'text-portal-ink'}`}>{k.title}</div>
                  {k.due_date && (
                    <div className={`text-xs ${overdue ? 'text-portal-copper font-medium' : 'text-portal-muted'}`}>
                      {overdue ? t.crm_overdue : t.crm_due} · {fmtDate(k.due_date, lang)}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SessionsTab({ clientId, sessions }: { clientId: string; sessions: CoachSession[] }) {
  const { t, lang } = useLanguage();
  const setStatus = useSetSessionStatus();
  const now = Date.now();
  const upcoming = sessions.filter((s) => new Date(s.starts_at).getTime() >= now).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const past = sessions.filter((s) => new Date(s.starts_at).getTime() < now);

  const row = (s: CoachSession, isPast: boolean) => (
    <li key={s.id} className="py-2 border-b border-portal-border last:border-0 space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="text-sm text-portal-ink flex-1">{fmtDateTime(s.starts_at, lang)}{s.kind === 'trial' ? ` · ${t.crm_trial}` : ''}</span>
        <span className={`text-[11px] px-1.5 py-0.5 rounded-[4px] border ${statusChip[s.status] ?? ''}`}>{t[`crm_status_${s.status}` as 'crm_status_scheduled']}</span>
      </div>
      {s.location && <div className="text-xs text-portal-muted">{s.location}</div>}
      {isPast && s.status === 'scheduled' && (
        <div className="flex gap-2">
          <button className={portalBtnGhost} onClick={() => setStatus.mutate({ id: s.id, status: 'attended' }, { onError: () => toast.error(t.crm_error) })}>{t.crm_mark_attended}</button>
          <button className={portalBtnGhost} onClick={() => setStatus.mutate({ id: s.id, status: 'no_show' }, { onError: () => toast.error(t.crm_error) })}>{t.crm_mark_no_show}</button>
        </div>
      )}
    </li>
  );

  return (
    <div className="space-y-5">
      <Link to={`/coach/calendar?client=${clientId}`} className={portalBtnPrimary}><Plus className="h-4 w-4" />{t.crm_book_session}</Link>
      {sessions.length === 0 ? (
        <p className="text-sm text-portal-muted">{t.crm_no_sessions}</p>
      ) : (
        <>
          {upcoming.length > 0 && <div><div className={portalLabel}>{t.crm_upcoming}</div><ul>{upcoming.map((s) => row(s, false))}</ul></div>}
          {past.length > 0 && <div><div className={portalLabel}>{t.crm_past}</div><ul>{past.map((s) => row(s, true))}</ul></div>}
        </>
      )}
    </div>
  );
}

function DetailsTab({ client, onDeleted }: { client: NonNullable<NonNullable<ReturnType<typeof useClientDetail>['data']>['client']>; onDeleted: () => void }) {
  const { t } = useLanguage();
  const update = useUpdateClient();
  const del = useDeleteClient();
  const move = useMoveClient();
  const [v, setV] = useState({ display_name: client.display_name, phone: client.phone ?? '', email: client.email ?? '', goal: client.goal ?? '', source: client.source ?? '' });
  const [confirm, setConfirm] = useState(false);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const name = v.display_name.trim();
    if (!name) return toast.error(t.crm_name_required);
    update.mutate(
      { id: client.id, display_name: name.slice(0, 120), phone: v.phone.trim().slice(0, 40) || null, email: v.email.trim().slice(0, 255) || null, goal: v.goal.trim().slice(0, 300) || null, source: v.source.trim().slice(0, 120) || null },
      { onSuccess: () => toast.success(t.crm_saved), onError: () => toast.error(t.crm_error) },
    );
  };

  const f = (k: keyof typeof v, label: string, type = 'text') => (
    <label className="block space-y-1">
      <span className={portalLabel}>{label}</span>
      <input type={type} value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} className={portalInput} />
    </label>
  );

  const archived = client.stage === 'archived';

  return (
    <div className="space-y-6">
      <form onSubmit={save} className="space-y-3">
        {f('display_name', t.crm_name)}
        {f('phone', t.crm_phone, 'tel')}
        {f('email', t.crm_email, 'email')}
        <p className="text-xs text-portal-muted">{t.crm_private_helper}</p>
        {f('goal', t.crm_goal)}
        {f('source', t.crm_source)}
        <button type="submit" className={portalBtnPrimary} disabled={update.isPending}>{t.crm_save}</button>
      </form>
      <div className="pt-4 border-t border-portal-border flex flex-wrap gap-2">
        <button className={portalBtnGhost} onClick={() => move.move(client.id, archived ? 'enquiry' : 'archived').catch(() => toast.error(t.crm_error))}>
          {archived ? t.crm_unarchive : t.crm_archive}
        </button>
        <button className={`${portalBtnGhost} text-portal-copper border-portal-copper`} onClick={() => setConfirm(true)}>{t.crm_delete}</button>
      </div>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent className="coach-portal bg-portal-card border-portal-border rounded-[4px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-portal-ink">{t.crm_delete_title}</AlertDialogTitle>
            <AlertDialogDescription className="text-portal-muted-strong">{t.crm_delete_body}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-[4px]">{t.crm_cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-[4px] bg-portal-copper hover:bg-portal-copper-hover text-portal-on-copper"
              onClick={() => del.mutate(client.id, { onSuccess: onDeleted, onError: () => toast.error(t.crm_error) })}
            >
              {t.crm_delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
