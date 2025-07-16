from rest_framework.permissions import BasePermission, SAFE_METHODS
from core.constants import UserRoles
from tenant_apps.project_management.models import ProjectMember


class IsTenantAdminWithAssignOnce(BasePermission):
    """
    Allows tenant admin to assign members only if the project does not yet have a project manager.
    After assignment, tenant admin becomes read-only for project members.
    """

    def has_permission(self, request, view):
        # Safe methods are always allowed
        if request.method in SAFE_METHODS:
            return True

        user = request.user
        if user.role != UserRoles.TENANT_ADMIN:
            return True  # Let others pass, this only limits Tenant Admin

        # Try to extract the project ID from request
        project_id = None
        if request.method in ("POST", "PUT", "PATCH"):
            project_id = request.data.get("project")
        elif view.action in ["destroy", "partial_update", "update"]:
            obj = view.get_object()
            project_id = obj.project_id

        if not project_id:
            return False  # Without a project context, deny

        has_pm = ProjectMember.objects.filter(
            project_id=project_id,
            role=UserRoles.PROJECT_MANAGER,
            is_active=True
        ).exists()

        # Deny write access if a project manager is already assigned
        return not has_pm