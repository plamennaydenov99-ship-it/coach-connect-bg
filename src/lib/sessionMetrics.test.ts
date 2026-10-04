import { test, expect } from 'bun:test';
import { attendanceCounts, coachedHours } from './sessionMetrics';

const base = { starts_at: '2026-10-04T07:00:00Z', ends_at: '2026-10-04T08:00:00Z' };
test('group attendance counts each attendee, not each group', () => {
  const result = attendanceCounts([{ ...base, capacity: 12, status: 'scheduled', attendees: [
    { status: 'attended' }, { status: 'attended' }, { status: 'no_show' }, { status: 'booked' }, { status: 'cancelled' },
  ] }, { ...base, capacity: null, status: 'no_show' }]);
  expect(result).toEqual({ attended: 2, noShow: 2, percentage: 50 });
});
test('a group adds its duration once to coached hours', () => {
  expect(coachedHours([{ ...base, capacity: 12, status: 'scheduled', attendees: [{ status: 'attended' }, { status: 'attended' }] },
    { ...base, capacity: null, status: 'attended' }])).toBe(2);
});
test('cancelled groups do not affect attendance or hours', () => {
  const sessions = [{ ...base, capacity: 12, status: 'cancelled', attendees: [{ status: 'attended' }] }];
  expect(attendanceCounts(sessions).percentage).toBeNull();
  expect(coachedHours(sessions)).toBe(0);
});