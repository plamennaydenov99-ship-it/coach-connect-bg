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

/** Club header summary: group classes, private hires and average class fill. */
export function clubSummary(sessions: (Session & { kind?: string })[]) {
  const f = classFill(sessions);
  return { ...f, hires: sessions.filter(s => s.kind === 'hire' && s.status !== 'cancelled').length };
}

const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

/**
 * Facility occupancy for one Mon–Sun week: booked hours ÷ open hours.
 * Open hours = 7 × (close − open). Booked hours = non-cancelled session time inside
 * the week window [weekStartMs, weekEndMs), so sessions crossing the week edge only count their inside part.
 */
export function resourceOccupancy(
  r: { open_time: string; close_time: string },
  sessions: { status: string; starts_at: string; ends_at: string }[],
  weekStartMs: number, weekEndMs: number,
) {
  const openHours = 7 * Math.max(0, toMin(r.close_time) - toMin(r.open_time)) / 60;
  const bookedHours = sessions.filter(s => s.status !== 'cancelled').reduce((sum, s) => {
    const a = Math.max(Date.parse(s.starts_at), weekStartMs);
    const b = Math.min(Date.parse(s.ends_at), weekEndMs);
    return sum + Math.max(0, b - a) / 3600000;
  }, 0);
  return { bookedHours, openHours, percentage: openHours ? Math.min(100, Math.round(100 * bookedHours / openHours)) : 0 };
}
