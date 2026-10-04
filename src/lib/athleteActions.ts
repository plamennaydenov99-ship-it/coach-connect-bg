import type { NavigateFunction } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getOrCreateConversation } from '@/lib/messaging';
import type { AppRole } from '@/hooks/useAuth';

export type AthleteActionContext = {
  userId?: string;
  role?: AppRole;
  navigate: NavigateFunction;
  signInText: string;
  athleteOnlyText: string;
  unavailableText?: string;
};

export function guardAthlete(ctx: AthleteActionContext): string | null {
  if (!ctx.userId) {
    toast.error(ctx.signInText);
    ctx.navigate('/start');
    return null;
  }
  if (ctx.role !== 'athlete') {
    toast.error(ctx.athleteOnlyText);
    return null;
  }
  return ctx.userId;
}

export async function messageOwner(ctx: AthleteActionContext, ownerId: string) {
  const athleteId = guardAthlete(ctx);
  if (!athleteId) return;
  try {
    const cid = await getOrCreateConversation(athleteId, ownerId);
    ctx.navigate(`/account/messages?c=${cid}`);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : (error as { message?: string }).message);
  }
}

export async function requestSpot(ctx: AthleteActionContext, sessionId: string, ownerId: string, content: string): Promise<'sent' | 'requested' | null> {
  const athleteId = guardAthlete(ctx);
  if (!athleteId) return null;
  // Recheck before sending a message so reopening or retrying does not duplicate it.
  const existing = await supabase.from('spot_requests').select('id').eq('athlete_id', athleteId).eq('session_id', sessionId).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return 'requested';
  if (!content.trim()) throw new Error(ctx.unavailableText || ctx.athleteOnlyText);
  const available = await supabase.from('public_sessions').select('id, owner_id, spots_left').eq('id', sessionId).maybeSingle();
  if (available.error) throw available.error;
  if (!available.data || available.data.owner_id !== ownerId || (available.data.spots_left ?? 0) <= 0) {
    throw new Error(ctx.unavailableText || ctx.athleteOnlyText);
  }
  const conversationId = await getOrCreateConversation(athleteId, ownerId);
  const message = await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: athleteId, content: content.trim() });
  if (message.error) throw message.error;
  const request = await supabase.from('spot_requests').insert({ session_id: sessionId, athlete_id: athleteId, owner_id: ownerId, conversation_id: conversationId });
  if (request.error?.code === '23505') return 'requested';
  if (request.error) throw request.error;
  return 'sent';
}

export async function toggleAthleteBookmark(ctx: AthleteActionContext, targetType: 'session' | 'event' | 'club', targetId: string, saved: boolean): Promise<boolean | null> {
  const athleteId = guardAthlete(ctx);
  if (!athleteId) return null;
  const result = saved
    ? await supabase.from('bookmarks').delete().eq('athlete_id', athleteId).eq('target_type', targetType).eq('target_id', targetId)
    : await supabase.from('bookmarks').insert({ athlete_id: athleteId, target_type: targetType, target_id: targetId });
  if (result.error && result.error.code !== '23505') throw result.error;
  return !saved;
}
