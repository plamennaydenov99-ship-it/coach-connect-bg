import { supabase } from '@/integrations/supabase/client';

/** Tables added after the generated Supabase types were last refreshed (events, club_listings, club_claims, listing_reports). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = supabase as unknown as { from: (table: string) => any };
