type Attendance = { status: string };
type Session = Attendance & { capacity: number | null; starts_at: string; ends_at: string; attendees?: Attendance[] };

/** Attendance is per participant; coaching hours count each taught group once. */
export function attendanceCounts(sessions: Session[]) {
  let attended = 0;
  let noShow = 0;
  for (const s of sessions) {
    if (s.status === 'cancelled') continue;
    const people = s.capacity == null ? [s] : s.attendees ?? [];
    attended += people.filter(a => a.status === 'attended').length;
    noShow += people.filter(a => a.status === 'no_show').length;
  }
  return { attended, noShow, percentage: attended + noShow ? Math.round(100 * attended / (attended + noShow)) : null };
}

export function coachedHours(sessions: Session[]) {
  return sessions.filter(s => s.status !== 'cancelled' && (s.capacity == null
    ? s.status === 'attended' : s.attendees?.some(a => a.status === 'attended')))
    .reduce((sum, s) => sum + (Date.parse(s.ends_at) - Date.parse(s.starts_at)) / 3600000, 0);
}
/** Group classes in a period and average fill: booked/attended attendees ÷ capacity, ignoring cancelled classes. */
export function classFill(sessions: Session[]) {
  const classes = sessions.filter(s => s.capacity != null && s.status !== 'cancelled');
  const seats = classes.reduce((n, s) => n + (s.capacity ?? 0), 0);
  const booked = classes.reduce((n, s) => n + (s.attendees ?? []).filter(a => a.status === 'booked' || a.status === 'attended').length, 0);
  return { classes: classes.length, fill: seats ? Math.round(100 * booked / seats) : 0 };
}
