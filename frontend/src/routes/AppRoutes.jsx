import { Routes, Route } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import TenantSignup from '../components/auth/TenantSignup';
import SetPasswordPage from '../components/auth/SetPasswordPage';
import AdminDashboard from "../features/Tenant Admin/AdminDashboard";
import HrDashboard from "../features/HR/HrDashboard";
import ProjectManagerDashboard from "../features/Project Manager/ProjectManagerDashboard";
import ProtectedRoute from './ProtectedRoute';
import UnprotectedRoute from './unProtectedRoute';
import ConditionalLanding from './ConditionalLandingPage';
import DeveloperDashboard from '../features/Developer/DeveloperDashboard';
import NotFound from '../components/errors/NotFound';
import AppLayout from '../layouts/AppLayout';

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<AppLayout />}>
      <Route index element={<ConditionalLanding />} />

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

      <Route path="/set-password/:uid/:token" element={<SetPasswordPage />} />

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
