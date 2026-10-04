import { Navigate, useParams } from 'react-router-dom';
import { CLUB_PORTAL_SEGMENTS, clubProfilePath } from '@/lib/routes';
import NotFound from './NotFound';

/** Redirects old `/club/:id` profile links to `/clubs/:id`, ignoring reserved portal segments. */
const LegacyClubRedirect = () => {
  const { id } = useParams();
  if (!id || CLUB_PORTAL_SEGMENTS.includes(id)) return <NotFound />;
  return <Navigate to={clubProfilePath(id)} replace />;
};

export default LegacyClubRedirect;
