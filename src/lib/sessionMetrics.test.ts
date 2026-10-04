/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { attendanceCounts, coachedHours } from './sessionMetrics';

const base = { starts_at: '2026-10-04T07:00:00Z', ends_at: '2026-10-04T08:00:00Z' };
test('group attendance counts each attendee, not each group', () => {
  const result = attendanceCounts([{ ...base, capacity: 12, status: 'scheduled', attendees: [
    { status: 'attended' }, { status: 'attended' }, { status: 'no_show' }, { status: 'booked' }, { status: 'cancelled' },
  ] }, { ...base, capacity: null, status: 'no_show' }]);
  assert.deepEqual(result, { attended: 2, noShow: 2, percentage: 50 });
});
test('a group adds its duration once to coached hours', () => {
  assert.equal(coachedHours([{ ...base, capacity: 12, status: 'scheduled', attendees: [{ status: 'attended' }, { status: 'attended' }] },
    { ...base, capacity: null, status: 'attended' }]), 2);
});
test('cancelled groups do not affect attendance or hours', () => {
  const sessions = [{ ...base, capacity: 12, status: 'cancelled', attendees: [{ status: 'attended' }] }];
  assert.equal(attendanceCounts(sessions).percentage, null);
  assert.equal(coachedHours(sessions), 0);
});
test('class fill is booked attendees divided by capacity, excluding cancelled classes', async () => {
  const { classFill } = await import('./sessionMetrics');
  const at = (status: string) => ({ status });
  const g = (status: string, capacity: number, attendees: { status: string }[]) => ({ status, capacity, starts_at: '2026-10-05T10:00:00Z', ends_at: '2026-10-05T11:00:00Z', attendees });
  const r = classFill([
    g('scheduled', 10, [at('booked'), at('booked'), at('attended'), at('no_show'), at('cancelled')]),
    g('scheduled', 10, [at('booked'), at('booked'), at('booked'), at('booked'), at('booked')]),
    g('cancelled', 20, [at('booked')]),
    { status: 'scheduled', capacity: null, starts_at: '2026-10-05T10:00:00Z', ends_at: '2026-10-05T11:00:00Z' },
  ]);
  assert.deepEqual(r, { classes: 2, fill: 40 });
});

test('class fill is zero with no classes', async () => {
  const { classFill } = await import('./sessionMetrics');
  assert.deepEqual(classFill([]), { classes: 0, fill: 0 });
});

test('occupancy is booked hours over 7 × daily open hours, excluding cancelled sessions', async () => {
  const { resourceOccupancy } = await import('./sessionMetrics');
  const ws = Date.parse('2026-10-04T21:00:00Z'); const we = ws + 7 * 86400000;
  const s = (status: string, a: string, b: string) => ({ status, starts_at: a, ends_at: b });
  // Open 07:00–23:00 = 16h × 7 = 112h. Booked: 2h + 1.5h + 3.5h = 7h → 6.25% → 6.
  const r = resourceOccupancy({ open_time: '07:00:00', close_time: '23:00:00' }, [
    s('scheduled', '2026-10-05T08:00:00Z', '2026-10-05T10:00:00Z'),
    s('attended', '2026-10-06T08:00:00Z', '2026-10-06T09:30:00Z'),
    s('scheduled', '2026-10-07T08:00:00Z', '2026-10-07T11:30:00Z'),
    s('cancelled', '2026-10-08T08:00:00Z', '2026-10-08T18:00:00Z'),
  ], ws, we);
  assert.deepEqual(r, { bookedHours: 7, openHours: 112, percentage: 6 });
});

test('occupancy only counts the part of a session inside the week', async () => {
  const { resourceOccupancy } = await import('./sessionMetrics');
  const ws = Date.parse('2026-10-04T21:00:00Z'); const we = ws + 7 * 86400000;
  const r = resourceOccupancy({ open_time: '09:00', close_time: '19:00' }, [
    { status: 'scheduled', starts_at: '2026-10-04T20:00:00Z', ends_at: '2026-10-04T23:00:00Z' },
  ], ws, we);
  assert.deepEqual(r, { bookedHours: 2, openHours: 70, percentage: 3 });
});

test('club summary counts private hires separately from classes', async () => {
  const { clubSummary } = await import('./sessionMetrics');
  const b = { starts_at: '2026-10-05T10:00:00Z', ends_at: '2026-10-05T11:00:00Z' };
  assert.deepEqual(clubSummary([
    { ...b, kind: 'session', status: 'scheduled', capacity: 4, attendees: [{ status: 'booked' }] },
    { ...b, kind: 'hire', status: 'scheduled', capacity: null },
    { ...b, kind: 'hire', status: 'cancelled', capacity: null },
  ]), { classes: 1, fill: 25, hires: 1 });
});
