import { supabase } from '@/integrations/supabase/client';

/**
 * bookings/conversations reference auth.users, not profiles, so PostgREST can't embed
 * profiles there. Fetch the profiles separately and attach them under `as`.
 */
export async function attachProfiles<R extends Record<string, any>, K extends string>(
  rows: R[],
  idKey: keyof R,
  as: K,
  cols = 'id, full_name, avatar_url, city',
): Promise<(R & Record<K, any>)[]> {
  const ids = [...new Set(rows.map((r) => r[idKey]).filter(Boolean))] as string[];
  if (!ids.length) return rows as any;
  const { data } = await supabase.from('profiles').select(cols).in('id', ids);
  const by = new Map(((data ?? []) as any[]).map((p) => [p.id, p]));
  return rows.map((r) => ({ ...r, [as]: by.get(r[idKey]) ?? null })) as any;
}
