import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { fetchTrending, rpc, sampleTrending, type TrendingData } from '@/lib/trending';

export function useTrending(city: string, sport: string, kind: string, period: string, sample: boolean) {
  return useQuery<TrendingData>({
    queryKey: ['trending', city, sport, kind, period, sample],
    queryFn: async () => (sample ? sampleTrending() : fetchTrending(city, sport, kind, period)),
    staleTime: 30000,
    refetchInterval: sample ? false : 60000,
  });
}

export type WaitlistEntry = { session_id: string; status: 'waiting' | 'offered' | 'claimed' | 'left'; offered_until: string | null; title: string | null; starts_at: string | null; owner_id: string | null };

// The signed-in athlete's open waitlist places, with a held offer first.
export function useMyWaitlist() {
  const { user, profile } = useAuth();
  const uid = user?.id;
  return useQuery<WaitlistEntry[]>({
    queryKey: ['waitlist', uid],
    enabled: !!uid && profile?.role === 'athlete',
    refetchInterval: 60000,
    queryFn: async () => {
      const rows = await (supabase as unknown as { from: (t: string) => { select: (c: string) => { eq: (c: string, v: string) => { in: (c: string, v: string[]) => Promise<{ data: { session_id: string; status: WaitlistEntry['status']; offered_until: string | null }[] | null; error: unknown }> } } } })
        .from('session_waitlist').select('session_id, status, offered_until').eq('athlete_id', uid as string).in('status', ['waiting', 'offered']);
      if (rows.error) throw rows.error;
      const list = rows.data ?? [];
      if (!list.length) return [];
      const sessions = await supabase.from('public_sessions').select('id, title, starts_at, owner_id').in('id', list.map(r => r.session_id));
      return list
        .map(r => { const s = sessions.data?.find(x => x.id === r.session_id); return { ...r, title: s?.title ?? null, starts_at: s?.starts_at ?? null, owner_id: s?.owner_id ?? null }; })
        .filter(r => r.status === 'waiting' || (r.offered_until && Date.parse(r.offered_until) > Date.now()))
        .sort((a, b) => (a.status === 'offered' ? -1 : 1) - (b.status === 'offered' ? -1 : 1));
    },
  });
}

export async function joinWaitlist(sessionId: string): Promise<number> {
  const { data, error } = await rpc<number>('join_waitlist', { p_session: sessionId });
  if (error) throw new Error(error.message);
  return data ?? 1;
}
export async function leaveWaitlist(sessionId: string) {
  const { error } = await rpc('leave_waitlist', { p_session: sessionId });
  if (error) throw new Error(error.message);
}
export async function claimWaitlist(sessionId: string) {
  await rpc('claim_waitlist', { p_session: sessionId });
}

// Approved coaches whose profile city matches, verified ones first.
export function useCityCoaches(city: string, limit = 12) {
  return useQuery({
    queryKey: ['trending', 'coaches', city, limit],
    staleTime: 60000,
    queryFn: async () => {
      const r = await supabase.from('coach_profiles').select('id, sport, sports, verified, profiles!coach_profiles_id_fkey(full_name, avatar_url, city)').eq('application_status', 'approved');
      if (r.error) throw r.error;
      return (r.data ?? [])
        .filter(c => (c.profiles?.city ?? '').toLowerCase().includes(city.toLowerCase()))
        .sort((a, b) => Number(b.verified) - Number(a.verified))
        .slice(0, limit);
    },
  });
}
