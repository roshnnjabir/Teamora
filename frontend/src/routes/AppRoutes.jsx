import { Routes, Route } from 'react-router-dom';
import LoginForm from '../domains/auth/LoginForm';
import ConditionalAccessWorkspace from '../wrappers/ConditionalAccessWorkspace';
import TenantSignup from '../domains/auth/TenantSignup';
import SetPasswordPage from '../domains/auth/SetPasswordPage';
import SuperAdminDashboard from '../domains/superAdmin/pages/SuperAdminDashboard';
import TenantAdminDashboard from '../domains/tenantAdmin/pages/TenantAdminDashboard';
import TenantAdminProjectDetail from '../domains/tenantAdmin/pages/TenantAdminProjectDetail';
import HrDashboard from "../domains/hr/admin/pages/HrDashboard";
import ProjectManagerDashboard from "../domains/project/manager/pages/ProjectManagerDashboard";
import ProjectManagerProjectDetail from '../domains/project/manager/pages/ProjectDetail';
import ProtectedRoute from '../wrappers/ProtectedRoute';
import UnprotectedRoute from '../wrappers/UnprotectedRoute';
import ConditionalLanding from '../wrappers/ConditionalLandingPage';
import DeveloperDashboard from '../domains/project/developer/pages/DeveloperDashboard';
import NotFound from '../domains/general/pages/NotFound';
import AppLayout from '../layouts/AppLayout';
import DomainWrapper from '../wrappers/DomainWrapper';
import TaskDetailPage from '../domains/project/shared/components/TaskDetailPage';
import PaymentRequiredPage from '../domains/general/pages/PaymentRequiredPage';
import UserProfilePage from '../domains/general/pages/UserProfilePage';
import ChatDashboard from "../domains/chat/pages/ChatDashboard";

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<AppLayout />}>
      <Route index element={<ConditionalLanding />} />
      <Route path="/accessyourworkspace" element={<ConditionalAccessWorkspace />} />

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

      <Route
        path="profile"
        element={
          <ProtectedRoute>
            <UserProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="/payment-required" element={<PaymentRequiredPage />} />
      <Route path="/payment-success" element={<div>✅ Payment Successful!</div>} />
      <Route path="/payment-cancel" element={<div>❌ Payment Cancelled.</div>} />

      <Route path="/set-password/:uid/:token" element={<SetPasswordPage />} />

      <Route path="super_admin" element={
        <ProtectedRoute allowedRoles={["super_admin", "Super Admin"]}>
          <SuperAdminDashboard />
        </ProtectedRoute>
      } />

      <Route path="tenant_admin" element={
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

      <Route path="project_manager/projects/:projectId" element={
        <ProtectedRoute allowedRoles={["Project Manager", "project_manager"]}>
          <ProjectManagerProjectDetail />
        </ProtectedRoute>
      } />

      <Route path="tenant_admin/projects/:projectId" element={
        <ProtectedRoute allowedRoles={["Tenant Admin", "tenant_admin"]}>
          <TenantAdminProjectDetail />
        </ProtectedRoute>
      } />
      
      <Route path="project_manager/tasks/:taskId" element={
        <ProtectedRoute allowedRoles={["Project Manager", "project_manager"]}>
          <TaskDetailPage />
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