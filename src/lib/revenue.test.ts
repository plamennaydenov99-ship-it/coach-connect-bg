import { describe, it, expect } from 'vitest';
import { earned, revenueReport, type RevClient, type RevInput, type RevSession } from './revenue';

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
});
