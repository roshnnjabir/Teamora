// src/wrappers/ConditionalAccessWorkspace.jsx
import { Navigate } from 'react-router-dom';
import AccessYourWorkspace from '../domains/auth/AccessYourWorkspace';
import { isSubdomain } from '../utils/domainUtils';

const ConditionalAccessWorkspace = () => {
  const isMainDomain = !isSubdomain();

  return isMainDomain ? (
    <AccessYourWorkspace />
  ) : (
    <Navigate to="/login" replace />
  );
};

export default ConditionalAccessWorkspace;