# core/permissions.py

from rest_framework.permissions import BasePermission, SAFE_METHODS
from core.constants import UserRoles

class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_super_admin()


class IsTenantAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_tenant_admin()


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


class IsProjectReadOnlyOrManager(BasePermission):
    """
    Allows full access to project managers and tenant admins.
    Developers only get safe methods (GET, HEAD, OPTIONS).
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        # Read-only for all authenticated users
        if request.method in SAFE_METHODS:
            return True

        # Only PM or TA can write
        return request.user.role in [
            UserRoles.PROJECT_MANAGER,
            UserRoles.TENANT_ADMIN,
        ]


class IsAssigneeOrManager(BasePermission):
    """
    Allows access to project managers, tenant admins, or the developer assigned to the task.
    """

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_tenant_admin():
            return True
        if user.role == 'project_manager':
            return True
        if obj.assigned_to and obj.assigned_to.user_id == user.id:
            return request.method in ['PATCH']
        return False