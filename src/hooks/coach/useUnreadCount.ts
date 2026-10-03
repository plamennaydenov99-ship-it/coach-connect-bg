import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface UnreadMsg { id: string; conversation_id: string; created_at: string; content: string }

/** Unread messages (from the other participant) across the coach's conversations, kept live. */
export function useUnreadCount() {
  const { user } = useAuth();
  const uid = user?.id;
  const qc = useQueryClient();
  const key = ['coach', uid, 'unread'];
  const q = useQuery({
    queryKey: key,
    enabled: !!uid,
    queryFn: async (): Promise<UnreadMsg[]> => {
      const { data, error } = await supabase
        .from('messages')
        .select('id, conversation_id, created_at, content, conversations!inner(coach_id)')
        .eq('conversations.coach_id', uid!)
        .neq('sender_id', uid!)
        .is('read_at', null)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []).map(({ conversations: _c, ...m }: any) => m);
    },
  });

  useEffect(() => {
    if (!uid) return;
    const ch = supabase
      .channel(`unread-${uid}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        qc.invalidateQueries({ queryKey: ['coach', uid, 'unread'] });
        qc.invalidateQueries({ queryKey: ['coach', uid, 'inbox'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [uid, qc]);

  const items = q.data ?? [];
  const byConvo = new Map<string, UnreadMsg[]>();
  for (const m of items) byConvo.set(m.conversation_id, [...(byConvo.get(m.conversation_id) ?? []), m]);
  return { count: items.length, byConvo, isLoading: q.isLoading };
}
