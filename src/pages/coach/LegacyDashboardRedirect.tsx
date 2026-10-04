import { Navigate, useLocation } from 'react-router-dom';
import { clubPortalPathFor, coachPortalPathFor } from '@/lib/routes';

/** Sends a coach or club on an old `/dashboard/*` URL to the matching portal page. */
export default function LegacyDashboardRedirect({ role = 'coach' }: { role?: 'coach' | 'club' }) {
  const { pathname, search } = useLocation();
  const sub = pathname.replace(/^\/dashboard/, '');
  const to = role === 'club' ? clubPortalPathFor(sub) : coachPortalPathFor(sub);
  return <Navigate to={to + search} replace />;
}
