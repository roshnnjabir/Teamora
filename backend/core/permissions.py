# core/permissions.py

from rest_framework.permissions import BasePermission
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