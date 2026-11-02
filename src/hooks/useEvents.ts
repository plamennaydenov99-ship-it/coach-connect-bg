import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { EVENT_COLS, type EventRow } from '@/lib/events';

/** Every published event that has not ended yet, soonest first. The database only lets visitors see those rows. */
export function useUpcomingEvents() {
  return useQuery({
    queryKey: ['events', 'upcoming'],
    staleTime: 60_000,
    queryFn: async (): Promise<EventRow[]> => {
      const { data, error } = await db.from('events').select(EVENT_COLS).eq('status', 'published').order('starts_on', { ascending: true }).limit(500);
      if (error) throw error;
      return (data ?? []) as EventRow[];
    },
  });
}

export function useEvent(slug: string | undefined) {
  return useQuery({
    queryKey: ['events', 'one', slug],
    enabled: !!slug,
    queryFn: async (): Promise<EventRow | null> => {
      const { data, error } = await db.from('events').select(EVENT_COLS).eq('slug', slug).eq('status', 'published').maybeSingle();
      if (error) throw error;
      return (data ?? null) as EventRow | null;
    },
  });
}
