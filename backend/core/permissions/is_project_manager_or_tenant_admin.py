from rest_framework.permissions import BasePermission
from core.constants import UserRoles

class IsProjectManagerOrTenantAdmin(BasePermission):
    """
    Allows access only to users with role 'project_manager' or 'tenant_admin'.
    """
    def has_permission(self, request, view):
        allowed_roles = [
            UserRoles.PROJECT_MANAGER,
            UserRoles.TENANT_ADMIN,
        ]
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in allowed_roles
        )