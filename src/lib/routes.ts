/** Landing page for a signed-in user by role. Coaches move to `/coach` once the portal exists. */
export function homeFor(role: string | null | undefined): string {
  if (role === 'athlete') return '/account';
  if (role === 'coach') return '/dashboard';
  return '/dashboard';
}

/** Public coach profile URL. */
export const coachProfilePath = (id: string) => `/coaches/${id}`;

/** Segments reserved for the future coach portal under `/coach/*`. */
export const COACH_PORTAL_SEGMENTS = ['dashboard', 'clients', 'calendar', 'messages', 'profile', 'settings'];
