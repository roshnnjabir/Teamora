import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from '../components/Dashboard';
import LoginForm from '../components/auth/LoginForm';
import TenantSignup from '../components/auth/TenantSignup';
import AdminDashboard from "../features/Tenant Admin/AdminDashboard";
import HrDashboard from "../features/HR/HrDashboard";
import ProjectManagerDashboard from "../features/Project Manager/ProjectManagerDashboard.JSX";
import ProtectedRoute from './ProtectedRoute';
import LandingPage from '../components/LandingPage';
import DeveloperDashboard from '../features/Developer/DeveloperDashboard';

const AppRoutes = () => (
  <Router>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginForm />} />
      <Route path="/signup" element={<TenantSignup />} />
      <Route path="/dashboard" element={<Dashboard />} />


      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={["Tenant Admin", "tenant_admin", "super_admin", "Super Admin"]}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      <Route path="/hr" element={
        <ProtectedRoute allowedRoles={["HR", "hr"]}>
          <HrDashboard />
        </ProtectedRoute>
      } />

      <Route path="/project_manager" element={
        <ProtectedRoute allowedRoles={["Project Manager", "project_manager"]}>
          <ProjectManagerDashboard />
        </ProtectedRoute>
      } />

      <Route path="/developer" element={
        <ProtectedRoute allowedRoles={["Developer", "developer"]}>
          <DeveloperDashboard />
        </ProtectedRoute>
      } />
    </Routes>
  </Router>
);

export default AppRoutes;
