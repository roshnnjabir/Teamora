// src/routes/UnprotectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const UnprotectedRoute = ({ children }) => {
  const user = useSelector((state) => state.auth.user);

  if (user) {
    // Redirect based on role if needed
    switch (user.role) {
      case "tenant_admin":
        return <Navigate to="/admin" replace />;
      case "project_manager":
        return <Navigate to="/project_manager" replace />;
      case "developer":
        return <Navigate to="/developer" replace />;
      case "hr":
        return <Navigate to="/hr" replace />;
      default:
        return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default UnprotectedRoute;
