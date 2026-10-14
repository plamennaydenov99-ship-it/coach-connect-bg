import { describe, it, expect } from 'vitest';
import { billableLines, earned, revenueReport, type RevClient, type RevInput, type RevSession } from './revenue';

const TZ = 'Europe/Sofia';
const client = (p: Partial<RevClient> = {}): RevClient => ({
  id: 'c1', billing_type: 'per_session', rate: 30, billing_start: null, created_at: '2026-01-01T00:00:00Z',
  stage: 'active', acquired_via: 'own', pipeline_id: 'p1', display_name: 'Ana', ...p,
});
const session = (p: Partial<RevSession> = {}): RevSession => ({
  id: 's' + Math.random(), client_id: 'c1', kind: 'session', capacity: null, status: 'attended',
  starts_at: '2026-10-05T08:00:00Z', price: null, attendees: [], ...p,
});
const input = (p: Partial<RevInput>): RevInput => ({
  clients: [client()], sessions: [], chargeNoShows: false, now: new Date('2026-10-14T12:00:00Z'), timezone: TZ, ...p,
});
const OCT = ['2026-10-01', '2026-10-31'] as const;

describe('revenue estimate', () => {
  it('per-session client: attended earns the rate', () => {
    expect(earned(input({ sessions: [session()] }), ...OCT).total).toBe(30);
  });
  it('no-show earns nothing unless charging no-shows', () => {
    const s = [session({ status: 'no_show' })];
    expect(earned(input({ sessions: s }), ...OCT).total).toBe(0);
    expect(earned(input({ sessions: s, chargeNoShows: true }), ...OCT).total).toBe(30);
  });
  it('group session: price per attended head, attributed to each attendee', () => {
    const clients = [client({ id: 'a', display_name: 'A' }), client({ id: 'b', display_name: 'B', acquired_via: 'lokka_trending' })];
    const s = [session({ client_id: null, capacity: 8, price: 15, attendees: [
      { client_id: 'a', status: 'attended' }, { client_id: 'b', status: 'attended' }, { client_id: 'a', status: 'no_show' },
    ] })];
    const r = earned(input({ clients, sessions: s }), ...OCT);
    expect(r.total).toBe(30);
    expect(r.topClients.map((c) => c.amount)).toEqual([15, 15]);
    expect(r.bySource.find((x) => x.key === 'lokka_trending')?.amount).toBe(15);
  });
  it('trial without a session price earns 0', () => {
    expect(earned(input({ sessions: [session({ kind: 'trial' })] }), ...OCT).total).toBe(0);
    expect(earned(input({ sessions: [session({ kind: 'trial', price: 20 })] }), ...OCT).total).toBe(20);
  });
  it('weekly fee counts each Monday on/after billing start (mid-month start)', () => {
    // Billing from Wed 7 Oct → Mondays 12 Oct (earned), 19 & 26 Oct (still to come on 14 Oct).
    const c = client({ billing_type: 'weekly', rate: 50, billing_start: '2026-10-07' });
    const r = revenueReport(input({ clients: [c] }));
    expect(r.thisMonth.total).toBe(50);
    expect(r.expectedMonth).toBe(150);
  });
  it('monthly fee counts from the billing start month', () => {
    const c = client({ billing_type: 'monthly', rate: 200, billing_start: '2026-09-20' });
    const r = revenueReport(input({ clients: [c] }));
    expect(r.thisMonth.total).toBe(200);
    expect(r.lastMonth.total).toBe(200);
    expect(earned(input({ clients: [c] }), '2026-08-01', '2026-08-31').total).toBe(0);
  });
  it('fees are 0 when the client is not active now', () => {
    const c = client({ billing_type: 'monthly', rate: 200, stage: 'on_hold', billing_start: '2026-09-01' });
    expect(revenueReport(input({ clients: [c] })).thisMonth.total).toBe(0);
  });
  it('compares month-to-date with last month up to the same day', () => {
    const sessions = [
      session({ starts_at: '2026-10-03T08:00:00Z' }), session({ starts_at: '2026-10-10T08:00:00Z' }), // Oct to date: 60
      session({ starts_at: '2026-09-05T08:00:00Z' }), // Sep 1–14: 30
      session({ starts_at: '2026-09-25T08:00:00Z' }), // after the same day: excluded from comparison
    ];
    const r = revenueReport(input({ sessions }));
    expect(r.thisMonth.total).toBe(60);
    expect(r.lastMonthToDate.total).toBe(30);
    expect(r.lastMonth.total).toBe(60);
    expect(r.deltaPct).toBe(100);
  });

  it('billable lines follow the earned rules and skip billed sessions', () => {
    const clients = [client(), client({ id: 'c2' })];
    const sessions = [
      session({ id: 'x1' }), session({ id: 'x2', status: 'no_show' }), session({ id: 'x3', kind: 'trial' }),
      session({ id: 'x4', starts_at: '2026-10-20T08:00:00Z', status: 'scheduled' }), // future
      session({ id: 'x5' }),
      session({ id: 'g1', client_id: null, capacity: 6, price: 12, attendees: [{ client_id: 'c1', status: 'attended' }, { client_id: 'c2', status: 'attended' }] }),
    ];
    const lines = billableLines(input({ clients, sessions }), 'c1', ...OCT, ['x5']);
    expect(lines.map((l) => [l.session_id, l.kind, l.unit_price])).toEqual(
      expect.arrayContaining([['x1', 'session', 30], ['g1', 'group', 12]]),
    );
    expect(lines).toHaveLength(2);
    expect(billableLines(input({ clients, sessions, chargeNoShows: true }), 'c1', ...OCT, ['x5'])).toHaveLength(3);
  });
  it('billable lines add one line per weekly / monthly fee', () => {
    const w = client({ billing_type: 'weekly', rate: 50, billing_start: '2026-09-01' });
    const sep = billableLines(input({ clients: [w] }), 'c1', '2026-09-01', '2026-09-30');
    expect(sep.map((l) => l.date)).toEqual(['2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28']);
    const m = client({ billing_type: 'monthly', rate: 200, billing_start: '2026-09-15' });
    expect(billableLines(input({ clients: [m] }), 'c1', '2026-09-01', '2026-09-30')).toEqual([
      expect.objectContaining({ kind: 'fee', unit_price: 200, session_id: null }),
    ]);
  });
});
