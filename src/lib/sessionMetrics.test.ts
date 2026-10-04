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
