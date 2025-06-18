// ConditionalLanding.tsx
import { Navigate } from 'react-router-dom';
import LandingPage from '../components/LandingPage';

const ConditionalLanding = () => {
  const isLocalhost = window.location.hostname === 'localhost';
  return isLocalhost ? <LandingPage /> : <Navigate to="/login" replace />;
};

export default ConditionalLanding;