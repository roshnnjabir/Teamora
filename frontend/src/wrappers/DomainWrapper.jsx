// components/DomainWrapper.jsx
import { Navigate } from 'react-router-dom';
import { isSubdomain } from '../utils/domainUtils';

const DomainWrapper = ({ children }) => {
  if (isSubdomain()) {
    return <Navigate to="/not-found" replace />;
  }

  return <>{children}</>;
};

export default DomainWrapper;