// src/routes/UnprotectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { isSubdomain } from "../utils/domainUtils";

const UnprotectedRoute = ({ children }) => {
  const user = useSelector((state) => state.auth.user);

  const isRootDomain = !isSubdomain();


  if (user) {
    const role = user.role?.toLowerCase();

    
    switch (role) {
      case "super_admin":
        return isRootDomain
          ? <Navigate to="/super_admin" replace />
          : <Navigate to="/unauthorized" replace />;
      case "tenant_admin":
        return <Navigate to="/tenant_admin" replace />;
      case "project_manager":
        return <Navigate to="/project_manager" replace />;
      case "developer":
        return <Navigate to="/developer" replace />;
      case "hr":
        return <Navigate to="/hr" replace />;
      default:
        return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

export default UnprotectedRoute;