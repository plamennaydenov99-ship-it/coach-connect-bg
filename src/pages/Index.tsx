import { Navigate } from 'react-router-dom';

// Legacy route — root is now SplitEntry. This redirects any stale links to athlete view.
const Index = () => <Navigate to="/athlete" replace />;
export default Index;
