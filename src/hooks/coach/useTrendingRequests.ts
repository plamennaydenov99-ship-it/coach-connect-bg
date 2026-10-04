import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';

export function useTrendingRequests() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const cache = useQueryClient();
  const uid = user?.id;
  const key = ['coach', uid, 'trending-requests'];
  const query = useQuery({
    queryKey: key,
    enabled: !!uid,
    queryFn: async () => {
      if (!uid) return [];
      const result = await supabase.from('spot_requests')
        .select('id, conversation_id, athlete_id, session_id, created_at')
        .eq('owner_id', uid).eq('status', 'new').order('created_at', { ascending: false }).limit(5);
      if (result.error) throw result.error;
      const rows = result.data ?? [];
      if (!rows.length) return [];
      const [athletes, sessions] = await Promise.all([
        supabase.from('profiles').select('id, full_name').in('id', rows.map(r => r.athlete_id)),
        supabase.from('coach_sessions').select('id, title, starts_at').eq('coach_id', uid).in('id', rows.map(r => r.session_id)),
      ]);
      if (athletes.error) throw athletes.error;
      if (sessions.error) throw sessions.error;
      return rows.map(row => ({ ...row, name: athletes.data?.find(a => a.id === row.athlete_id)?.full_name, session: sessions.data?.find(s => s.id === row.session_id) }));
    },
  });
  useEffect(() => {
    if (!uid) return;
    const channel = supabase.channel(`trending-requests-${uid}`).on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'spot_requests', filter: `owner_id=eq.${uid}`,
    }, () => { toast.info(t.disc_new_request); cache.invalidateQueries({ queryKey: ['coach', uid, 'trending-requests'] }); })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'spot_requests', filter: `owner_id=eq.${uid}` }, () => cache.invalidateQueries({ queryKey: ['coach', uid, 'trending-requests'] })).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [uid, cache, t.disc_new_request]);
  const handled = useMutation({
    mutationFn: async (id: string) => {
      if (!uid) throw new Error(t.coach_sign_in_required);
      const { error } = await supabase.from('spot_requests').update({ status: 'handled' }).eq('id', id).eq('owner_id', uid);
      if (error) throw error;
    },
    onSuccess: () => { cache.invalidateQueries({ queryKey: key }); toast.success(t.disc_handled_done); },
    onError: () => toast.error(t.crm_error),
  });
  return { ...query, handled };
}
