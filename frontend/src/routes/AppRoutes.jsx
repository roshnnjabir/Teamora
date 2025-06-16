import { Routes, Route } from 'react-router-dom';
import Dashboard from '../components/Dashboard';
import LoginForm from '../components/auth/LoginForm';
import TenantSignup from '../components/auth/TenantSignup';
import AdminDashboard from "../features/Tenant Admin/AdminDashboard";
import HrDashboard from "../features/HR/HrDashboard";
import ProjectManagerDashboard from "../features/Project Manager/ProjectManagerDashboard";
import ProtectedRoute from './ProtectedRoute';
import UnprotectedRoute from './unProtectedRoute';
import LandingPage from '../components/LandingPage';
import DeveloperDashboard from '../features/Developer/DeveloperDashboard';
import NotFound from '../components/errors/NotFound';
import AppLayout from '../layouts/AppLayout';

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<AppLayout />}>
      <Route index element={<LandingPage />} />
      <Route path="dashboard" element={<Dashboard />} />

      <Route path="/login" element={
        <UnprotectedRoute>
          <LoginForm />
        </UnprotectedRoute>
      } />

      <Route path="/signup" element={
        <UnprotectedRoute>
          <TenantSignup />
        </UnprotectedRoute>
      } />

      <Route path="admin" element={
        <ProtectedRoute allowedRoles={["Tenant Admin", "tenant_admin", "super_admin", "Super Admin"]}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      <Route path="hr" element={
        <ProtectedRoute allowedRoles={["HR", "hr"]}>
          <HrDashboard />
        </ProtectedRoute>
      } />

      <Route path="project_manager" element={
        <ProtectedRoute allowedRoles={["Project Manager", "project_manager"]}>
          <ProjectManagerDashboard />
        </ProtectedRoute>
      } />

      <Route path="developer" element={
        <ProtectedRoute allowedRoles={["Developer", "developer"]}>
          <DeveloperDashboard />
        </ProtectedRoute>
      } />
    </Route>

    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRoutes;
