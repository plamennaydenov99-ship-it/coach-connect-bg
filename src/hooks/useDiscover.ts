import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useDiscover() {
  const { user, profile } = useAuth();
  const publicData = useQuery({
    queryKey: ['discover', 'public'],
    queryFn: async () => {
      const [items, sessions, coaches, clubs] = await Promise.all([
        supabase.from('trending_items').select('*').eq('active', true).order('rank').order('created_at'),
        supabase.from('public_sessions').select('id, owner_id, title, sport, starts_at, ends_at, led_by, location, capacity, spots_left').order('starts_at'),
        supabase.from('coach_profiles').select('id, sport, verified, profiles!coach_profiles_id_fkey(full_name, avatar_url, city)').eq('application_status', 'approved'),
        supabase.from('club_profiles').select('id, name, sport, city, verified, profiles!club_profiles_id_fkey(avatar_url)').eq('application_status', 'approved'),
      ]);
      for (const result of [items, sessions, coaches, clubs]) if (result.error) throw result.error;
      // Staff/admin readers have broader RLS: apply the same active/future filter explicitly.
      const today = new Date().toISOString().slice(0, 10);
      return {
        items: (items.data ?? []).filter(i => !i.ends_on || i.ends_on >= today),
        sessions: (sessions.data ?? []).filter(s => s.id && s.owner_id && s.starts_at && new Date(s.starts_at).getTime() > Date.now()),
        coaches: coaches.data ?? [], clubs: clubs.data ?? [],
      };
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });
  const uid = user?.id;
  const privateData = useQuery({
    queryKey: ['discover', uid, 'saved-requests'],
    enabled: !!uid && profile?.role === 'athlete',
    queryFn: async () => {
      if (!uid) return { bookmarks: [], requests: [] };
      const [bookmarks, requests] = await Promise.all([
        supabase.from('bookmarks').select('target_type, target_id').eq('athlete_id', uid),
        supabase.from('spot_requests').select('session_id').eq('athlete_id', uid),
      ]);
      if (bookmarks.error) throw bookmarks.error;
      if (requests.error) throw requests.error;
      return { bookmarks: bookmarks.data ?? [], requests: requests.data ?? [] };
    },
  });
  return { publicData, privateData };
}
