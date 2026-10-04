import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';

type T = Database['public']['Tables'];
export type CoachClient = T['coach_clients']['Row'];
export type CoachSession = T['coach_sessions']['Row'] & { attendee_id?: string };
export type CoachTask = T['coach_tasks']['Row'];
export type ClientEvent = T['client_events']['Row'];
export type ClientNote = T['client_notes']['Row'];

export const BOARD_STAGES = ['enquiry', 'trial', 'active', 'on_hold'] as const;
export const ALL_STAGES = [...BOARD_STAGES, 'archived'] as const;
export type Stage = (typeof ALL_STAGES)[number];

export interface ClientSummary extends CoachClient {
  nextSession: CoachSession | null;
  attendedCount: number;
  openTasks: number;
}

const keys = {
  list: (uid?: string) => ['coach', uid, 'clients'] as const,
  client: (uid: string | undefined, id: string) => ['coach', uid, 'client', id] as const,
};

/** All clients for the current coach with derived next session / counts. */
export function useClientList() {
  const { user } = useAuth();
  const uid = user?.id;
  return useQuery({
    queryKey: keys.list(uid),
    enabled: !!uid,
    queryFn: async (): Promise<ClientSummary[]> => {
      const [c, s, t] = await Promise.all([
        supabase.from('coach_clients').select('*').eq('coach_id', uid!).order('stage_position'),
        supabase.from('coach_sessions').select('*, attendees:session_attendees(id, client_id, status)').eq('coach_id', uid!).neq('status', 'cancelled'),
        supabase.from('coach_tasks').select('id, client_id').eq('coach_id', uid!).eq('done', false),
      ]);
      if (c.error) throw c.error;
      if (s.error) throw s.error;
      if (t.error) throw t.error;
      const now = Date.now();
      return (c.data ?? []).map((cl) => {
        const mine = (s.data ?? []).flatMap(x => {
          if (x.client_id === cl.id) return [x];
          const attendee = x.attendees.find(a => a.client_id === cl.id && a.status !== 'cancelled');
          return attendee ? [{ ...x, status: attendee.status === 'booked' ? 'scheduled' : attendee.status }] : [];
        });
        const upcoming = mine
          .filter((x) => x.status === 'scheduled' && new Date(x.starts_at).getTime() >= now)
          .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
        return {
          ...cl,
          nextSession: upcoming[0] ?? null,
          attendedCount: mine.filter((x) => x.status === 'attended').length,
          openTasks: (t.data ?? []).filter((x) => x.client_id === cl.id).length,
        };
      });
    },
  });
}

export function useCreateClient() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { display_name: string; phone?: string; email?: string; goal?: string; source?: string; stage: Stage }) => {
      const list = qc.getQueryData<ClientSummary[]>(keys.list(user?.id)) ?? [];
      const maxPos = Math.max(-1, ...list.filter((c) => c.stage === v.stage).map((c) => c.stage_position));
      const { data, error } = await supabase
        .from('coach_clients')
        .insert({
          coach_id: user!.id,
          display_name: v.display_name,
          phone: v.phone || null,
          email: v.email || null,
          goal: v.goal || null,
          source: v.source || null,
          stage: v.stage,
          stage_position: maxPos + 1,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { toast.success(t.crm_client_created); qc.invalidateQueries({ queryKey: ['coach', user?.id] }); },
  });
}

/** Persist a new ordering for the board (optimistic, rolls back on error). */
export function useReorderClients() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const qc = useQueryClient();
  const key = keys.list(user?.id);
  return useMutation({
    mutationFn: async (changes: { id: string; stage: string; stage_position: number }[]) => {
      const results = await Promise.all(
        changes.map((c) =>
          supabase
            .from('coach_clients')
            .update({ stage: c.stage, stage_position: c.stage_position })
            .eq('id', c.id)
            .eq('coach_id', user!.id),
        ),
      );
      const err = results.find((r) => r.error)?.error;
      if (err) throw err;
    },
    onMutate: async (changes) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<ClientSummary[]>(key);
      if (prev) {
        const map = new Map(changes.map((c) => [c.id, c]));
        qc.setQueryData<ClientSummary[]>(
          key,
          prev
            .map((c) => (map.has(c.id) ? { ...c, ...map.get(c.id)! } : c))
            .sort((a, b) => a.stage_position - b.stage_position),
        );
      }
      return { prev };
    },
    onSuccess: () => toast.success(t.crm_stage_updated),
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['coach', user?.id] }),
  });
}

/** Move one client to a stage (appended at the end of that column). */
export function useMoveClient() {
  const reorder = useReorderClients();
  const { user } = useAuth();
  const qc = useQueryClient();
  return {
    ...reorder,
    move: (id: string, stage: string) => {
      const list = qc.getQueryData<ClientSummary[]>(keys.list(user?.id)) ?? [];
      const maxPos = Math.max(-1, ...list.filter((c) => c.stage === stage && c.id !== id).map((c) => c.stage_position));
      return reorder.mutateAsync([{ id, stage, stage_position: maxPos + 1 }]);
    },
  };
}

export function useUpdateClient() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<CoachClient> & { id: string }) => {
      const { error } = await supabase.from('coach_clients').update(patch).eq('id', id).eq('coach_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coach', user?.id] }); },
  });
}

export function useDeleteClient() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('coach_clients').delete().eq('id', id).eq('coach_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coach', user?.id] }); },
  });
}

/** Everything the drawer needs for one client. */
export function useClientDetail(id: string | undefined) {
  const { user } = useAuth();
  const uid = user?.id;
  return useQuery({
    queryKey: keys.client(uid, id ?? ''),
    enabled: !!uid && !!id,
    queryFn: async () => {
      const [c, s, t, e, n, a] = await Promise.all([
        supabase.from('coach_clients').select('*').eq('coach_id', uid!).eq('id', id!).maybeSingle(),
        supabase.from('coach_sessions').select('*').eq('coach_id', uid!).eq('client_id', id!).order('starts_at', { ascending: false }),
        supabase.from('coach_tasks').select('*').eq('coach_id', uid!).eq('client_id', id!).order('created_at', { ascending: false }),
        supabase.from('client_events').select('*').eq('coach_id', uid!).eq('client_id', id!).eq('type', 'stage_change'),
        supabase.from('client_notes').select('*').eq('relationship_id', id!).order('created_at', { ascending: false }),
        supabase.from('session_attendees').select('id, status, session:coach_sessions!inner(*)').eq('client_id', id!).eq('session.coach_id', uid!),
      ]);
      for (const r of [c, s, t, e, n, a]) if (r.error) throw r.error;
      return {
        client: c.data as CoachClient | null,
        sessions: [...(s.data ?? []), ...(a.data ?? []).map(row => ({ ...row.session, attendee_id: row.id, status: row.session.status === 'cancelled' ? 'cancelled' : row.status === 'booked' ? 'scheduled' : row.status }))].sort((x,y) => y.starts_at.localeCompare(x.starts_at)) as CoachSession[],
        tasks: (t.data ?? []) as CoachTask[],
        events: (e.data ?? []) as ClientEvent[],
        notes: (n.data ?? []) as ClientNote[],
      };
    },
  });
}

export function useAddNote(clientId: string) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from('client_notes').insert({ relationship_id: clientId, content });
      if (error) throw error;
    },
    onSuccess: () => { toast.success(t.dash_note_saved); qc.invalidateQueries({ queryKey: keys.client(user?.id, clientId) }); },
  });
}

export function useAddTask(clientId: string) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { title: string; due_date?: string | null }) => {
      const { error } = await supabase
        .from('coach_tasks')
        .insert({ coach_id: user!.id, client_id: clientId, title: v.title, due_date: v.due_date || null });
      if (error) throw error;
    },
    onSuccess: () => { toast.success(t.crm_task_saved); qc.invalidateQueries({ queryKey: ['coach', user?.id] }); },
  });
}

export function useToggleTask() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await supabase
        .from('coach_tasks')
        .update({ done, done_at: done ? new Date().toISOString() : null })
        .eq('id', id)
        .eq('coach_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success(t.crm_task_done); qc.invalidateQueries({ queryKey: ['coach', user?.id] }); },
  });
}

export function useSetSessionStatus() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, attendee_id }: { id: string; status: 'attended' | 'no_show'; attendee_id?: string }) => {
      if (!user) throw new Error('Sign in required');
      const { error } = attendee_id
        ? await supabase.from('session_attendees').update({ status }).eq('id', attendee_id).eq('session_id', id)
        : await supabase.from('coach_sessions').update({ status }).eq('id', id).eq('coach_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success(t.cal_updated); qc.invalidateQueries({ queryKey: ['coach', user?.id] }); },
  });
}
