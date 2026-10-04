/** Landing page for a signed-in user by role. */
export function homeFor(role: string | null | undefined): string {
  if (role === 'athlete') return '/account';
  if (role === 'coach') return '/coach';
  if (role === 'club') return '/club';
  return '/dashboard';
}

/** Public coach profile URL. */
export const coachProfilePath = (id: string) => `/coaches/${id}`;

/** Segments reserved for the coach portal under `/coach/*`. */
export const COACH_PORTAL_SEGMENTS = ['dashboard', 'clients', 'calendar', 'messages', 'profile', 'settings'];

/** Maps a legacy `/dashboard/*` sub-path to its coach portal equivalent. */
export function coachPortalPathFor(dashboardSubPath: string): string {
  const [first, ...rest] = dashboardSubPath.replace(/^\/+|\/+$/g, '').split('/');
  switch (first) {
    case '': return '/coach/dashboard';
    case 'profile': return '/coach/profile';
    case 'availability':
    case 'requests': return '/coach/calendar';
    case 'clients': return rest.length ? `/coach/clients/${rest.join('/')}` : '/coach/clients';
    case 'messages': return '/coach/messages';
    case 'settings': return '/coach/settings';
    default: return '/coach/dashboard'; // analytics, billing, bookings, etc.
  }
}

/** Public club profile URL. */
export const clubProfilePath = (id: string) => `/clubs/${id}`;

/** Segments reserved for the club portal under `/club/*`. */
export const CLUB_PORTAL_SEGMENTS = ['dashboard', 'members', 'calendar', 'facilities', 'messages', 'profile', 'settings'];

/** Maps a legacy `/dashboard/*` sub-path to its club portal equivalent. */
export function clubPortalPathFor(dashboardSubPath: string): string {
  return coachPortalPathFor(dashboardSubPath).replace(/^\/coach/, '/club').replace(/^\/club\/clients/, '/club/members');
}
