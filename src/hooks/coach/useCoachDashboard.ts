import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCoachTz, type CalSession } from '@/hooks/coach/useCoachCalendar';
import type { CoachTask } from '@/hooks/coach/useCoachClients';
import { addDays, startOfWeek, todayStr, toDateStr, zonedToUtc } from '@/lib/tz';

export type DashTask = CoachTask & { client: { id: string; display_name: string } | null };

/** Dashboard data: last 8 weeks of sessions (+ this week), clients, open tasks. All in coach tz. */
export function useCoachDashboard() {
  const { user } = useAuth();
  const tz = useCoachTz();
  const uid = user?.id;
  const today = todayStr(tz);
  return useQuery({
    queryKey: ['coach', uid, 'dashboard', today, tz],
    enabled: !!uid,
    queryFn: async () => {
      const weekStart = startOfWeek(today);
      const from = addDays(weekStart, -7 * 7); // 8 weeks incl. current
      const fromIso = zonedToUtc(from, '00:00', tz).toISOString();
      const toIso = zonedToUtc(addDays(weekStart, 7), '00:00', tz).toISOString();
      const [s, c, t] = await Promise.all([
        supabase.from('coach_sessions').select('*, client:coach_clients(display_name)').eq('coach_id', uid!).gte('starts_at', fromIso).lt('starts_at', toIso).order('starts_at'),
        supabase.from('coach_clients').select('id, stage, created_at, display_name').eq('coach_id', uid!),
        supabase.from('coach_tasks').select('*, client:coach_clients(id, display_name)').eq('coach_id', uid!).eq('done', false),
      ]);
      for (const r of [s, c, t]) if (r.error) throw r.error;
      const sessions = (s.data ?? []) as unknown as CalSession[];
      const clients = c.data ?? [];
      const tasks = ((t.data ?? []) as unknown as DashTask[]).sort((a, b) => {
        const ao = a.due_date && a.due_date < today ? 0 : 1;
        const bo = b.due_date && b.due_date < today ? 0 : 1;
        if (ao !== bo) return ao - bo;
        return (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999') || a.created_at.localeCompare(b.created_at);
      });

      const live = sessions.filter((x) => x.status !== 'cancelled');
      const wk = (iso: string) => startOfWeek(toDateStr(iso, tz));
      const weeks = Array.from({ length: 8 }, (_, i) => addDays(from, i * 7));
      const perWeek = weeks.map((w) => ({ week: w, count: live.filter((x) => wk(x.starts_at) === w).length }));
      const thisWeek = live.filter((x) => wk(x.starts_at) === weekStart);
      const lastWeekCount = perWeek[6].count;
      const hours = thisWeek
        .filter((x) => x.status === 'attended')
        .reduce((h, x) => h + (new Date(x.ends_at).getTime() - new Date(x.starts_at).getTime()) / 3600000, 0);

      const since30 = Date.now() - 30 * 86400000;
      const recent = sessions.filter((x) => new Date(x.starts_at).getTime() >= since30 && new Date(x.starts_at).getTime() <= Date.now());
      const att = recent.filter((x) => x.status === 'attended').length;
      const ns = recent.filter((x) => x.status === 'no_show').length;

      const monthStart = today.slice(0, 8) + '01';
      const since7 = Date.now() - 7 * 86400000;
      const pipeline = { enquiry: 0, trial: 0, active: 0, on_hold: 0 } as Record<string, number>;
      for (const cl of clients) if (cl.stage in pipeline) pipeline[cl.stage]++;

      return {
        todaySessions: sessions.filter((x) => toDateStr(x.starts_at, tz) === today),
        sessionsWeek: thisWeek.length,
        sessionsDelta: thisWeek.length - lastWeekCount,
        activeClients: pipeline.active,
        activeNewMonth: clients.filter((x) => x.stage === 'active' && toDateStr(x.created_at, tz) >= monthStart).length,
        attendance: att + ns > 0 ? Math.round((att / (att + ns)) * 100) : null,
        hours: Math.round(hours * 10) / 10,
        newEnquiries: clients.filter((x) => x.stage === 'enquiry' && new Date(x.created_at).getTime() >= since7).length,
        tasksDue: tasks.filter((x) => x.due_date && x.due_date <= today).length,
        tasks: tasks.slice(0, 6),
        pipeline,
        perWeek,
      };
    },
  });
}

export function useQuickTask() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (title: string) => {
      const { error } = await supabase.from('coach_tasks').insert({ coach_id: user!.id, title });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coach', user?.id] }); },
  });
}

export interface InboxItem { id: string; name: string; last_message_at: string; preview: string | null }

/** Latest 6 conversations where the coach participates, with last message preview. */
export function useCoachInbox(limit = 6) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['coach', user?.id, 'inbox', limit],
    enabled: !!user,
    queryFn: async (): Promise<InboxItem[]> => {
      const { data, error } = await supabase
        .from('conversations')
        .select('id, last_message_at, other:profiles!conversations_athlete_id_fkey(full_name)')
        .eq('coach_id', user!.id)
        .order('last_message_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      const convos = (data ?? []) as any[];
      const previews = await Promise.all(convos.map((c) =>
        supabase.from('messages').select('content').eq('conversation_id', c.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ));
      return convos.map((c, i) => ({
        id: c.id,
        name: c.other?.full_name || '—',
        last_message_at: c.last_message_at,
        preview: previews[i].data?.content ?? null,
      }));
    },
  });
}
