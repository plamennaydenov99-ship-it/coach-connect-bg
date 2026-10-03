import { Navigate, useParams } from 'react-router-dom';
import { COACH_PORTAL_SEGMENTS, coachProfilePath } from '@/lib/routes';
import NotFound from './NotFound';

/** Redirects old `/coach/:id` profile links to `/coaches/:id`, ignoring reserved portal segments. */
const LegacyCoachRedirect = () => {
  const { id } = useParams();
  if (!id || COACH_PORTAL_SEGMENTS.includes(id)) return <NotFound />;
  return <Navigate to={coachProfilePath(id)} replace />;
};

export default LegacyCoachRedirect;
