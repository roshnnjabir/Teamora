import { Routes, Route } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import TenantSignup from '../components/auth/TenantSignup';
import SetPasswordPage from '../components/auth/SetPasswordPage';
import TenantAdminDashboard from '../features/Tenant Admin/TenantAdminDashboard';
import SuperAdminDashboard from '../features/Super Admin/SuperAdminDashboard';
import HrDashboard from "../features/HR/HrDashboard";
import ProjectManagerDashboard from "../features/Project Manager/ProjectManagerDashboard";
import ProtectedRoute from '../wrappers/ProtectedRoute';
import UnprotectedRoute from '../wrappers/UnprotectedRoute';
import ConditionalLanding from '../wrappers/ConditionalLandingPage';
import DeveloperDashboard from '../features/Developer/DeveloperDashboard';
import NotFound from '../components/OtherPages/NotFound';
import AppLayout from '../layouts/AppLayout';
import DomainWrapper from '../wrappers/DomainWrapper';

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<AppLayout />}>
      <Route index element={<ConditionalLanding />} />

      <Route path="/login" element={
        <UnprotectedRoute>
          <LoginForm />
        </UnprotectedRoute>
      } />

      <Route
        path="/signup"
        element={
          <DomainWrapper>
            <TenantSignup />
          </DomainWrapper>
        }
      />

      <Route path="/set-password/:uid/:token" element={<SetPasswordPage />} />

      <Route path="super_admin" element={
        <ProtectedRoute allowedRoles={["super_admin", "Super Admin"]}>
          <SuperAdminDashboard />
        </ProtectedRoute>
      } />

      <Route path="admin" element={
        <ProtectedRoute allowedRoles={["Tenant Admin", "tenant_admin", "super_admin", "Super Admin"]}>
          <TenantAdminDashboard />
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
