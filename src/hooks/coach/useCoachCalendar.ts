import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';
import { addDays, isoWeekday, startOfWeek, toDateStr, todayStr, zonedToUtc, type DateStr, type TimeStr } from '@/lib/tz';

type T = Database['public']['Tables'];
export type Series = T['session_series']['Row'];
export type Attendee = T['session_attendees']['Row'] & { client: { display_name: string } | null };
export type CalSession = T['coach_sessions']['Row'] & { client: { display_name: string } | null; attendees?: Attendee[] };
export const SESSION_SELECT = '*, client:coach_clients(display_name), attendees:session_attendees(*, client:coach_clients(display_name))';
export const sessionFill = (s: CalSession) => (s.attendees ?? []).filter(a => a.status === 'booked' || a.status === 'attended').length;
export type OpenSlot = T['availability_slots']['Row'];

export const TOPUP_WEEKS = 12;

/** Coach's display time zone (profiles.timezone, fallback Sofia). */
export function useCoachTz() {
  const { profile } = useAuth();
  return ((profile as any)?.timezone as string) || 'Europe/Sofia';
}

/** Sessions, series and open slots overlapping [from, to) (dates in coach tz). */
export function useCalendarRange(from: DateStr, to: DateStr) {
  const { user } = useAuth();
  const tz = useCoachTz();
  const uid = user?.id;
  return useQuery({
    queryKey: ['coach', uid, 'calendar', from, to, tz],
    enabled: !!uid,
    queryFn: async () => {
      if (!uid) throw new Error('Sign in required');
      const start = zonedToUtc(from, '00:00', tz).toISOString();
      const end = zonedToUtc(to, '00:00', tz).toISOString();
      const [s, sl, se] = await Promise.all([
        supabase.from('coach_sessions').select(SESSION_SELECT).eq('coach_id', uid).gte('starts_at', start).lt('starts_at', end).order('starts_at'),
        supabase.from('availability_slots').select('*').eq('coach_id', uid).eq('status', 'open').gte('date', from).lt('date', to),
        supabase.from('session_series').select('*').eq('coach_id', uid),
      ]);
      for (const r of [s, sl, se]) if (r.error) throw r.error;
      return {
        sessions: (s.data ?? []) as unknown as CalSession[],
        slots: (sl.data ?? []) as OpenSlot[],
        series: (se.data ?? []) as Series[],
      };
    },
  });
}

export function usePendingRequests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['coach', user?.id, 'pending-requests'],
    enabled: !!user,
    queryFn: async () => {
      if (!user) throw new Error('Sign in required');
      const { count, error } = await supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('coach_id', user.id).eq('status', 'pending');
      if (error) throw error;
      return count ?? 0;
    },
  });
}

/** Week key in coach tz — one series occurrence per week. */
const weekKey = (iso: string, tz: string) => startOfWeek(toDateStr(iso, tz));

/** Occurrence instants for a weekly pattern between two dates (inclusive). */
export function occurrences(p: { weekday: number; start_time: string; duration_min: number }, from: DateStr, until: DateStr, tz: string) {
  const out: { starts_at: string; ends_at: string; date: DateStr }[] = [];
  let d = addDays(from, (p.weekday - isoWeekday(from) + 7) % 7);
  while (d <= until) {
    const s = zonedToUtc(d, p.start_time.slice(0, 5), tz);
    out.push({ date: d, starts_at: s.toISOString(), ends_at: new Date(s.getTime() + p.duration_min * 60000).toISOString() });
    d = addDays(d, 7);
  }
  return out;
}

/** Insert missing occurrences for one series in [from, until], skipping weeks that already have one. */
async function fillSeries(series: Series, from: DateStr, until: DateStr, tz: string) {
  const lo = from < series.starts_on ? series.starts_on : from;
  const hi = series.ends_on && series.ends_on < until ? series.ends_on : until;
  if (lo > hi) return 0;
  const { data: existing, error } = await supabase
    .from('coach_sessions')
    .select('starts_at')
    .eq('series_id', series.id)
    .gte('starts_at', zonedToUtc(addDays(startOfWeek(lo), 0), '00:00', tz).toISOString())
    .lt('starts_at', zonedToUtc(addDays(hi, 7), '00:00', tz).toISOString());
  if (error) throw error;
  const taken = new Set((existing ?? []).map((e) => weekKey(e.starts_at, tz)));
  const rows = occurrences(series, lo, hi, tz)
    .filter((o) => !taken.has(weekKey(o.starts_at, tz)))
    .map((o) => ({
      coach_id: series.coach_id, client_id: series.client_id, series_id: series.id,
      starts_at: o.starts_at, ends_at: o.ends_at, location: series.location, kind: series.kind,
      capacity: series.capacity, title: series.title, sport: series.sport, led_by: series.led_by, is_public: series.is_public, resource_id: series.resource_id,
    }));
  if (!rows.length) return 0;
  const ins = await supabase.from('coach_sessions').insert(rows);
  if (ins.error) throw ins.error;
  return rows.length;
}

/** On calendar load: keep open-ended series topped up 12 weeks ahead (idempotent). */
export function useSeriesTopUp() {
  const { user } = useAuth();
  const tz = useCoachTz();
  const qc = useQueryClient();
  const ran = useRef(false);
  useEffect(() => {
    if (!user || ran.current) return;
    ran.current = true;
    (async () => {
      const { data, error } = await supabase.from('session_series').select('*').eq('coach_id', user.id).is('ends_on', null);
      if (error || !data?.length) return;
      const today = todayStr(tz);
      let added = 0;
      for (const s of data) {
        try { added += await fillSeries(s, today, addDays(today, TOPUP_WEEKS * 7), tz); } catch (e) { console.error('series top-up failed', e); }
      }
      if (added) qc.invalidateQueries({ queryKey: ['coach', user.id] });
    })();
  }, [user, tz, qc]);
}

/** Count existing non-cancelled sessions overlapping any candidate interval. */
export async function findOverlaps(coachId: string, candidates: { starts_at: string; ends_at: string }[], excludeIds: string[] = []) {
  if (!candidates.length) return 0;
  const min = candidates.reduce((a, c) => (c.starts_at < a ? c.starts_at : a), candidates[0].starts_at);
  const max = candidates.reduce((a, c) => (c.ends_at > a ? c.ends_at : a), candidates[0].ends_at);
  const { data, error } = await supabase
    .from('coach_sessions').select('id, starts_at, ends_at')
    .eq('coach_id', coachId).neq('status', 'cancelled').lt('starts_at', max).gt('ends_at', min);
  if (error) throw error;
  const rows = (data ?? []).filter((r) => !excludeIds.includes(r.id));
  return candidates.filter((c) => rows.some((r) => r.starts_at < c.ends_at && r.ends_at > c.starts_at)).length;
}

export interface BookInput {
  client_id: string | null;
  capacity?: number | null;
  title?: string;
  led_by?: string;
  sport?: string;
  is_public?: boolean;
  attendee_ids?: string[];
  date: DateStr;
  time: TimeStr;
  duration: number;
  location: string;
  kind: 'session' | 'trial';
  repeat: boolean;
  endsOn: DateStr | null;
}

/** Candidate intervals for a booking (used for the overlap warning and inserts). */
export function bookingCandidates(v: Pick<BookInput, 'date' | 'time' | 'duration' | 'repeat' | 'endsOn'>, tz: string) {
  if (!v.repeat) {
    const s = zonedToUtc(v.date, v.time, tz);
    return [{ date: v.date, starts_at: s.toISOString(), ends_at: new Date(s.getTime() + v.duration * 60000).toISOString() }];
  }
  const until = v.endsOn ?? addDays(v.date, TOPUP_WEEKS * 7);
  return occurrences({ weekday: isoWeekday(v.date), start_time: v.time, duration_min: v.duration }, v.date, until, tz);
}

export function useBookSession() {
  const { user } = useAuth();
  const tz = useCoachTz();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: BookInput) => {
      if (!user) throw new Error('Sign in required');
      if (v.capacity != null) {
        const { data: createdId, error } = await supabase.rpc('book_group_session', { payload: {
          capacity: v.capacity, title: v.title || null, sport: v.sport || null, is_public: v.is_public ?? false,
          attendee_ids: v.attendee_ids ?? [], repeat: v.repeat, location: v.location || null,
          date: v.date, time: v.time, duration: v.duration, weekday: isoWeekday(v.date), ends_on: v.endsOn,
          occurrences: bookingCandidates(v, tz),
        } });
        if (error) throw error;
        // The booking RPC predates "Led by"; store it on the new series/occurrences in one follow-up.
        const ledBy = v.led_by?.trim().slice(0, 80) || null;
        if (ledBy && createdId) {
          const id = createdId as string;
          const r = v.repeat
            ? await supabase.from('session_series').update({ led_by: ledBy }).eq('id', id).eq('coach_id', user.id)
            : { error: null };
          if (r.error) throw r.error;
          const q = supabase.from('coach_sessions').update({ led_by: ledBy }).eq('coach_id', user.id);
          const s = await (v.repeat ? q.eq('series_id', id) : q.eq('id', id));
          if (s.error) throw s.error;
        }
        return;
      }
      const base = { coach_id: user.id, client_id: v.client_id, location: v.location || null, kind: v.kind };
      if (!v.repeat) {
        const [c] = bookingCandidates(v, tz);
        const { error } = await supabase.from('coach_sessions').insert({ ...base, starts_at: c.starts_at, ends_at: c.ends_at });
        if (error) throw error;
        return;
      }
      const { data: series, error } = await supabase
        .from('session_series')
        .insert({ ...base, weekday: isoWeekday(v.date), start_time: v.time, duration_min: v.duration, starts_on: v.date, ends_on: v.endsOn })
        .select().single();
      if (error) throw error;
      await fillSeries(series, v.date, v.endsOn ?? addDays(v.date, TOPUP_WEEKS * 7), tz);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coach', user?.id] }); },
  });
}

export function useSessionStatus() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'attended' | 'no_show' | 'cancelled' | 'scheduled' }) => {
      if (!user) throw new Error('Sign in required');
      const { error } = await supabase.from('coach_sessions').update({ status }).eq('id', id).eq('coach_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coach', user?.id] }); },
  });
}

/** Cancel this occurrence and all later scheduled ones; end the series the day before. */
export function useCancelFollowing() {
  const { user } = useAuth();
  const tz = useCoachTz();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: CalSession) => {
      if (!user || !s.series_id) return;
      const from = new Date(Math.max(Date.now(), new Date(s.starts_at).getTime())).toISOString();
      const fromCur = s.starts_at < from ? s.starts_at : from;
      const up = await supabase.from('coach_sessions').update({ status: 'cancelled' })
        .eq('coach_id', user.id).eq('series_id', s.series_id).eq('status', 'scheduled').gte('starts_at', fromCur);
      if (up.error) throw up.error;
      const end = addDays(toDateStr(s.starts_at, tz), -1);
      const ser = await supabase.from('session_series').update({ ends_on: end }).eq('id', s.series_id).eq('coach_id', user.id);
      if (ser.error) throw ser.error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coach', user?.id] }); },
  });
}

export interface RescheduleInput {
  session: CalSession;
  date: DateStr;
  time: TimeStr;
  duration: number;
  location: string;
  scope: 'one' | 'following';
}

export function useReschedule() {
  const { user } = useAuth();
  const tz = useCoachTz();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: RescheduleInput) => {
      if (!user) throw new Error('Sign in required');
      const s = zonedToUtc(v.date, v.time, tz);
      const e = new Date(s.getTime() + v.duration * 60000);
      if (v.scope === 'one' || !v.session.series_id) {
        const { error } = await supabase.from('coach_sessions')
          .update({ starts_at: s.toISOString(), ends_at: e.toISOString(), location: v.location || null })
          .eq('id', v.session.id).eq('coach_id', user.id);
        if (error) throw error;
        return;
      }
      // This and following: update the series pattern, drop future scheduled occurrences, regenerate.
      const sid = v.session.series_id;
      const { data: series, error: se } = await supabase.from('session_series')
        .update({ weekday: isoWeekday(v.date), start_time: v.time, duration_min: v.duration, location: v.location || null })
        .eq('id', sid).eq('coach_id', user.id).select().single();
      if (se) throw se;
      const cutoff = new Date(Math.max(Date.now(), Math.min(new Date(v.session.starts_at).getTime(), s.getTime()))).toISOString();
      const del = await supabase.from('coach_sessions').delete()
        .eq('coach_id', user.id).eq('series_id', sid).eq('status', 'scheduled').gte('starts_at', cutoff);
      if (del.error) throw del.error;
      const from = toDateStr(cutoff, tz) > v.date ? toDateStr(cutoff, tz) : v.date;
      await fillSeries(series, from, series.ends_on ?? addDays(todayStr(tz), TOPUP_WEEKS * 7), tz);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coach', user?.id] }); },
  });
}
