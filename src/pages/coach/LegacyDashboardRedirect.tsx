import { Navigate, useLocation } from 'react-router-dom';
import { coachPortalPathFor } from '@/lib/routes';

/** Sends a coach on an old `/dashboard/*` URL to the matching `/coach/*` page. */
export default function LegacyDashboardRedirect() {
  const { pathname, search } = useLocation();
  const sub = pathname.replace(/^\/dashboard/, '');
  return <Navigate to={coachPortalPathFor(sub) + search} replace />;
}
