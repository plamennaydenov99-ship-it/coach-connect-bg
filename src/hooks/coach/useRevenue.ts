import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCoachTz } from '@/hooks/coach/useCoachCalendar';
import { addDays, addMonths, startOfWeek, todayStr, zonedToUtc } from '@/lib/tz';
import { earned, hasRevenueInputs, revenueReport, type RevClient, type RevInput, type RevSession } from '@/lib/revenue';

/** Revenue estimate for the staff dashboard: this month, last month and a 12-week series. */
export function useRevenue() {
  const { user } = useAuth();
  const uid = user?.id;
  const tz = useCoachTz();
  return useQuery({
    queryKey: ['coach', uid, 'revenue', tz],
    enabled: !!uid,
    queryFn: async () => {
      const today = todayStr(tz);
      const from = zonedToUtc(addDays(startOfWeek(today), -13 * 7), '00:00', tz).toISOString();
      const to = zonedToUtc(addMonths(today, 1), '00:00', tz).toISOString();
      const [c, s, b, p] = await Promise.all([
        supabase.from('coach_clients')
          .select('id, billing_type, rate, billing_start, created_at, stage, acquired_via, pipeline_id, display_name')
          .eq('coach_id', uid!),
        supabase.from('coach_sessions')
          .select('id, client_id, kind, capacity, status, starts_at, price, attendees:session_attendees(client_id, status)')
          .eq('coach_id', uid!).gte('starts_at', from).lt('starts_at', to),
        supabase.from('billing_settings').select('charge_no_shows').eq('owner_id', uid!).maybeSingle(),
        supabase.from('crm_pipelines').select('id, name, is_default').eq('owner_id', uid!),
      ]);
      for (const r of [c, s, b, p]) if (r.error) throw r.error;
      const clients: RevClient[] = (c.data ?? []).map((x) => ({ ...x, rate: x.rate == null ? null : Number(x.rate) }));
      const sessions: RevSession[] = (s.data ?? []).map((x) => ({ ...x, price: x.price == null ? null : Number(x.price), attendees: x.attendees ?? [] }));
      const input: RevInput = { clients, sessions, chargeNoShows: !!b.data?.charge_no_shows, now: new Date(), timezone: tz };
      return {
        ...revenueReport(input),
        hasInputs: hasRevenueInputs(clients, sessions),
        pipelines: p.data ?? [],
        _earned: (fromD: string, toD: string) => earned(input, fromD, toD),
      };
    },
  });
}
