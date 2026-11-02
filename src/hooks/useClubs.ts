import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { db } from '@/lib/db';

export interface ClubListing {
  id: string;
  slug: string;
  name: string;
  sports: string[];
  city: string;
  district: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  website: string | null;
  source_name: string | null;
  source_url: string | null;
  claimed_profile_id: string | null;
  last_checked_at: string | null;
}

export const LISTING_COLS = 'id, slug, name, sports, city, district, address, lat, lng, website, source_name, source_url, claimed_profile_id, last_checked_at';

/** One card in the clubs directory: a club that has joined Lokka, or a listing that has not been claimed yet. */
export interface ClubCardData {
  key: string;
  to: string;
  name: string;
  sports: string[];
  district: string | null;
  address: string | null;
  claimed: boolean;
  verified: boolean;
}

export function useClubs() {
  return useQuery({
    queryKey: ['clubs', 'directory'],
    staleTime: 60_000,
    queryFn: async (): Promise<ClubCardData[]> => {
      const [l, c] = await Promise.all([
        db.from('club_listings').select(LISTING_COLS).eq('status', 'published').order('name'),
        supabase.from('club_profiles').select('id, name, sport, sports, city, verified').eq('application_status', 'approved'),
      ]);
      if (l.error) throw l.error;
      const listings = (l.data ?? []) as ClubListing[];
      const byProfile = new Map(listings.filter(x => x.claimed_profile_id).map(x => [x.claimed_profile_id as string, x]));

      const joined: ClubCardData[] = (c.data ?? []).map(p => {
        const sports = (p.sports?.length ? p.sports : p.sport ? [p.sport] : []) as string[];
        const own = byProfile.get(p.id);
        return { key: p.id, to: `/clubs/${p.id}`, name: p.name || own?.name || 'Club', sports, district: own?.district ?? null, address: own?.address ?? null, claimed: true, verified: !!p.verified };
      });
      const unclaimed: ClubCardData[] = listings.filter(x => !x.claimed_profile_id)
        .map(x => ({ key: x.id, to: `/clubs/${x.slug}`, name: x.name, sports: x.sports ?? [], district: x.district, address: x.address, claimed: false, verified: false }));
      return [...joined, ...unclaimed].sort((a, b) => a.name.localeCompare(b.name));
    },
  });
}

export function useClubListing(slug: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['clubs', 'listing', slug],
    enabled: !!slug && enabled,
    queryFn: async (): Promise<ClubListing | null> => {
      const { data, error } = await db.from('club_listings').select(LISTING_COLS).eq('slug', slug).eq('status', 'published').maybeSingle();
      if (error) throw error;
      return (data ?? null) as ClubListing | null;
    },
  });
}
