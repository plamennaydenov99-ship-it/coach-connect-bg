import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import { useCoachTz } from '@/hooks/coach/useCoachCalendar';
import { addDays, zonedToUtc, type DateStr } from '@/lib/tz';
import { billableLines, type LineLabels, type RevClient, type RevSession } from '@/lib/revenue';
import type { Database } from '@/integrations/supabase/types';

type T = Database['public']['Tables'];
export type PaymentRequest = T['payment_requests']['Row'] & { client: { display_name: string } | null };
export type RequestLine = T['payment_request_lines']['Row'];
export type Payment = T['payments']['Row'];
export type BillingSettings = T['billing_settings']['Row'];

const k = {
  root: (uid?: string) => ['coach', uid, 'payment_requests'] as const,
  detail: (uid: string | undefined, id: string) => ['coach', uid, 'payment_requests', id] as const,
  settings: (uid?: string) => ['coach', uid, 'billing_settings'] as const,
};

/** Remaining amount of a request (0 for drafts/void). */
export const remaining = (r: Pick<PaymentRequest, 'status' | 'total' | 'paid_amount'>) =>
  r.status === 'sent' || r.status === 'partially_paid' ? Math.max(0, Number(r.total) - Number(r.paid_amount)) : 0;

/** Days past due (0 when not due yet or no due date). */
export function daysLate(r: Pick<PaymentRequest, 'due_date'>, today: DateStr) {
  if (!r.due_date) return 0;
  return Math.max(0, Math.round((Date.parse(today) - Date.parse(r.due_date)) / 86400000));
}
export const isOverdue = (r: PaymentRequest, today: DateStr) => remaining(r) > 0 && daysLate(r, today) > 0;

export function useBillingSettings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: k.settings(user?.id),
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('billing_settings').select('*').eq('owner_id', user!.id).maybeSingle();
      if (error) throw error;
      return data as BillingSettings | null;
    },
  });
}

export function useSaveBillingSettings() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Omit<BillingSettings, 'owner_id' | 'created_at' | 'updated_at'>>) => {
      const { error } = await supabase.from('billing_settings').upsert({ owner_id: user!.id, ...patch }, { onConflict: 'owner_id' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coach', user?.id] }),
  });
}

/** All requests and payments of the current staff account. */
export function usePaymentRequests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: k.root(user?.id),
    enabled: !!user,
    queryFn: async () => {
      const [r, p] = await Promise.all([
        supabase.from('payment_requests').select('*, client:coach_clients(display_name)').eq('owner_id', user!.id).order('created_at', { ascending: false }),
        supabase.from('payments').select('*').eq('owner_id', user!.id),
      ]);
      if (r.error) throw r.error;
      if (p.error) throw p.error;
      return { requests: (r.data ?? []) as PaymentRequest[], payments: (p.data ?? []) as Payment[] };
    },
  });
}

export function useRequestDetail(id: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: k.detail(user?.id, id ?? ''),
    enabled: !!user && !!id,
    queryFn: async () => {
      const [r, l, p] = await Promise.all([
        supabase.from('payment_requests').select('*, client:coach_clients(display_name)').eq('owner_id', user!.id).eq('id', id!).maybeSingle(),
        supabase.from('payment_request_lines').select('*').eq('owner_id', user!.id).eq('request_id', id!).order('position'),
        supabase.from('payments').select('*').eq('owner_id', user!.id).eq('request_id', id!).order('paid_on'),
      ]);
      for (const x of [r, l, p]) if (x.error) throw x.error;
      return { request: r.data as PaymentRequest | null, lines: (l.data ?? []) as RequestLine[], payments: (p.data ?? []) as Payment[] };
    },
  });
}

/** Builds lines for clients in a period with the revenue rules. */
async function buildLines(uid: string, tz: string, from: DateStr, to: DateStr, labels: LineLabels) {
  const fromIso = zonedToUtc(from, '00:00', tz).toISOString();
  const toIso = zonedToUtc(addDays(to, 1), '00:00', tz).toISOString();
  const [c, s, b, billed] = await Promise.all([
    supabase.from('coach_clients').select('id, billing_type, rate, billing_start, created_at, stage, acquired_via, pipeline_id, display_name').eq('coach_id', uid),
    supabase.from('coach_sessions').select('id, client_id, kind, capacity, status, starts_at, price, attendees:session_attendees(client_id, status)')
      .eq('coach_id', uid).gte('starts_at', fromIso).lt('starts_at', toIso),
    supabase.from('billing_settings').select('charge_no_shows').eq('owner_id', uid).maybeSingle(),
    supabase.from('payment_request_lines').select('session_id, request:payment_requests!inner(client_id, status)')
      .eq('owner_id', uid).not('session_id', 'is', null).neq('request.status', 'void'),
  ]);
  for (const x of [c, s, b, billed]) if (x.error) throw x.error;
  const clients: RevClient[] = (c.data ?? []).map((x) => ({ ...x, rate: x.rate == null ? null : Number(x.rate) }));
  const sessions: RevSession[] = (s.data ?? []).map((x) => ({ ...x, price: x.price == null ? null : Number(x.price), attendees: x.attendees ?? [] }));
  const input = { clients, sessions, chargeNoShows: !!b.data?.charge_no_shows, now: new Date(), timezone: tz };
  const billedFor = (clientId: string) => (billed.data ?? [])
    .filter((x) => (x.request as { client_id: string }).client_id === clientId).map((x) => x.session_id!);
  return { clients, linesFor: (clientId: string) => billableLines(input, clientId, from, to, billedFor(clientId), labels) };
}

async function insertDraft(uid: string, clientId: string, from: DateStr, to: DateStr, lines: ReturnType<typeof billableLines>) {
  const { data, error } = await supabase.from('payment_requests')
    .insert({ owner_id: uid, client_id: clientId, period_start: from, period_end: to }).select('id').single();
  if (error) throw error;
  if (lines.length) {
    const { error: lErr } = await supabase.from('payment_request_lines').insert(lines.map((l, i) => ({
      request_id: data.id, owner_id: uid, session_id: l.session_id, kind: l.kind, description: l.description, qty: l.qty, unit_price: l.unit_price, position: i,
    })));
    if (lErr) { await supabase.from('payment_requests').delete().eq('id', data.id); throw lErr; }
  }
  return data.id;
}

/** One draft per client with billable lines in the period. Returns the number created. */
export function useCreateDraftsForPeriod() {
  const { user } = useAuth();
  const tz = useCoachTz();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { from: DateStr; to: DateStr; labels: LineLabels }) => {
      const { clients, linesFor } = await buildLines(user!.id, tz, v.from, v.to, v.labels);
      let n = 0;
      for (const c of clients) {
        const lines = linesFor(c.id);
        if (!lines.length || lines.reduce((s, l) => s + l.qty * l.unit_price, 0) <= 0) continue;
        await insertDraft(user!.id, c.id, v.from, v.to, lines);
        n++;
      }
      return n;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: k.root(user?.id) }),
  });
}

/** Draft for one client (lines from the period, may be empty). Returns the new id. */
export function useCreateRequest() {
  const { user } = useAuth();
  const tz = useCoachTz();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { clientId: string; from: DateStr; to: DateStr; labels: LineLabels }) => {
      const { linesFor } = await buildLines(user!.id, tz, v.from, v.to, v.labels);
      return insertDraft(user!.id, v.clientId, v.from, v.to, linesFor(v.clientId));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: k.root(user?.id) }),
  });
}

function useInvalidate() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['coach', user?.id] });
}

export function useUpdateRequest() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string; due_date?: string | null; notes?: string | null; status?: 'sent' | 'void' }) => {
      const { error } = await supabase.from('payment_requests').update(patch).eq('id', id).eq('owner_id', user!.id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => toast.success(v.status === 'sent' ? t.inv_marked_sent : v.status === 'void' ? t.inv_voided : t.crm_saved),
    onError: () => toast.error(t.crm_error),
    onSettled: inv,
  });
}

export function useDeleteDraft() {
  const { user } = useAuth();
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('payment_requests').delete().eq('id', id).eq('owner_id', user!.id).eq('status', 'draft');
      if (error) throw error;
    },
    onSettled: inv,
  });
}

export function useSaveLine() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (v: { id?: string; request_id: string; description: string; qty: number; unit_price: number; position?: number }) => {
      const row = { description: v.description.trim().slice(0, 200), qty: v.qty, unit_price: v.unit_price };
      const { error } = v.id
        ? await supabase.from('payment_request_lines').update(row).eq('id', v.id).eq('owner_id', user!.id)
        : await supabase.from('payment_request_lines').insert({ ...row, request_id: v.request_id, owner_id: user!.id, kind: 'custom', position: v.position ?? 999 });
      if (error) throw error;
    },
    onError: () => toast.error(t.crm_error),
    onSettled: inv,
  });
}

export function useDeleteLine() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('payment_request_lines').delete().eq('id', id).eq('owner_id', user!.id);
      if (error) throw error;
    },
    onError: () => toast.error(t.crm_error),
    onSettled: inv,
  });
}

export function useRecordPayment() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (v: { request_id: string; amount: number; paid_on: string; method: 'cash' | 'bank' | 'card' | 'other' }) => {
      const { error } = await supabase.from('payments').insert({ ...v, owner_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => toast.success(t.inv_payment_saved),
    onError: () => toast.error(t.crm_error),
    onSettled: inv,
  });
}

export function useDeletePayment() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('payments').delete().eq('id', id).eq('owner_id', user!.id);
      if (error) throw error;
    },
    onError: () => toast.error(t.crm_error),
    onSettled: inv,
  });
}
