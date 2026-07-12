import { supabase } from '@/integrations/supabase/client';

/**
 * Get an existing conversation between an athlete and a coach, or create one.
 * Returns the conversation id.
 */
export async function getOrCreateConversation(athleteId: string, coachId: string): Promise<string> {
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('athlete_id', athleteId)
    .eq('coach_id', coachId)
    .maybeSingle();

  if (existing) return existing.id;

  const { data, error } = await supabase
    .from('conversations')
    .insert({ athlete_id: athleteId, coach_id: coachId })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}
