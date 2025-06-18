import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = useSelector((state) => state.auth.user);
  
  if (!user) return <Navigate to="/login" replace />;

  const normalizedRole = user?.role?.toLowerCase();
  const normalizedAllowed = allowedRoles?.map((r) => r.toLowerCase());
  
  if (allowedRoles && !normalizedAllowed.includes(normalizedRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
