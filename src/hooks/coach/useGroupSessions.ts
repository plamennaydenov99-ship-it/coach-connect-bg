import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';
import type { Attendee } from './useCoachCalendar';

export function useGroupRoster(sessionId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['coach', user?.id, 'roster', sessionId], enabled: !!user && !!sessionId,
    queryFn: async () => {
      if (!user) throw new Error('Sign in required');
      const { data, error } = await supabase.from('session_attendees')
        .select('*, client:coach_clients(display_name), session:coach_sessions!inner(coach_id)')
        .eq('session_id', sessionId).eq('session.coach_id', user.id).order('created_at');
      if (error) throw error;
      return (data ?? []) as unknown as Attendee[];
    },
  });
}

export function useGroupActions(sessionId: string) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (action:
      | { type: 'add'; client_id: string }
      | { type: 'status'; id: string; status: 'attended' | 'no_show' | 'cancelled' }
      | { type: 'settings'; capacity: number; is_public: boolean }) => {
      if (!user) throw new Error('Sign in required');
      const { data: owned, error: ownerError } = await supabase.from('coach_sessions').select('id')
        .eq('id', sessionId).eq('coach_id', user.id).maybeSingle();
      if (ownerError) throw ownerError;
      if (!owned) throw new Error('Session unavailable');
      const result = action.type === 'add'
        ? await supabase.from('session_attendees').upsert({ session_id: sessionId, client_id: action.client_id, status: 'booked' }, { onConflict: 'session_id,client_id' })
        : action.type === 'status'
          ? await supabase.from('session_attendees').update({ status: action.status }).eq('id', action.id).eq('session_id', sessionId)
          : await supabase.from('coach_sessions').update({ capacity: action.capacity, is_public: action.is_public }).eq('id', sessionId).eq('coach_id', user.id);
      if (result.error) throw result.error;
    },
    onSuccess: () => { toast.success(t.cal_updated); qc.invalidateQueries({ queryKey: ['coach', user?.id] }); },
    onError: () => toast.error(t.crm_error),
  });
}