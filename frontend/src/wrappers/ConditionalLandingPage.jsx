import { Navigate } from 'react-router-dom';
import LandingPage from '../components/LandingPage/LandingPage';
import { isSubdomain } from '../utils/domainUtils';

const ConditionalLanding = () => {
  const isMainDomain = !isSubdomain();

  return isMainDomain ? <LandingPage /> : <Navigate to="/login" replace />;
};

export default ConditionalLanding;