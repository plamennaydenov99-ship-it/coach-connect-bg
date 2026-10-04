import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';
import { addDays, startOfWeek, todayStr, zonedToUtc } from '@/lib/tz';
import { useCoachTz } from './useCoachCalendar';

export type ClubResource = Database['public']['Tables']['club_resources']['Row'];
export type ResourceInput = Pick<ClubResource, 'name' | 'sport' | 'kind' | 'capacity' | 'open_time' | 'close_time' | 'active'>;
export const RESOURCE_KINDS = ['court', 'room', 'field', 'pool', 'other'] as const;

/** All facilities owned by the signed-in club, in display order. */
export function useClubResources() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['coach', user?.id, 'resources'],
    enabled: !!user,
    queryFn: async () => {
      if (!user) throw new Error('Sign in required');
      const { data, error } = await supabase.from('club_resources').select('*')
        .eq('owner_id', user.id).order('sort_order').order('created_at');
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** This week's (Mon–Sun, club tz) sessions on any facility, plus the week bounds, for occupancy. */
export function useWeekResourceSessions() {
  const { user } = useAuth();
  const tz = useCoachTz();
  const ws = startOfWeek(todayStr(tz));
  return useQuery({
    queryKey: ['coach', user?.id, 'resource-week', ws, tz],
    enabled: !!user,
    queryFn: async () => {
      if (!user) throw new Error('Sign in required');
      const start = zonedToUtc(ws, '00:00', tz).getTime();
      const end = zonedToUtc(addDays(ws, 7), '00:00', tz).getTime();
      const { data, error } = await supabase.from('coach_sessions')
        .select('id, resource_id, status, starts_at, ends_at')
        .eq('coach_id', user.id).not('resource_id', 'is', null)
        .lt('starts_at', new Date(end).toISOString()).gt('ends_at', new Date(start).toISOString());
      if (error) throw error;
      return { start, end, sessions: data ?? [] };
    },
  });
}

export function useSaveResource() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...v }: Partial<ResourceInput> & { id?: string }) => {
      if (!user) throw new Error('Sign in required');
      const r = id
        ? await supabase.from('club_resources').update(v).eq('id', id).eq('owner_id', user.id)
        : await supabase.from('club_resources').insert({ ...(v as ResourceInput), owner_id: user.id });
      if (r.error) throw r.error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coach', user?.id] }),
  });
}

/** Number of upcoming non-cancelled sessions on a facility (delete is only allowed at zero). */
export async function futureSessionCount(resourceId: string) {
  const { count, error } = await supabase.from('coach_sessions').select('id', { count: 'exact', head: true })
    .eq('resource_id', resourceId).neq('status', 'cancelled').gt('ends_at', new Date().toISOString());
  if (error) throw error;
  return count ?? 0;
}

export function useDeleteResource() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Sign in required');
      if (await futureSessionCount(id)) throw new Error('in_use');
      const { error } = await supabase.from('club_resources').delete().eq('id', id).eq('owner_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coach', user?.id] }),
  });
}
