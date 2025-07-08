# core/permissions.py

from rest_framework.permissions import BasePermission, SAFE_METHODS
from core.constants import UserRoles

class IsSuperAdmin(BasePermission):
    """
    Allows access only to users with role 'super_admin(site-admin)'.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_super_admin()


class IsTenantAdmin(BasePermission):
    """
    Allows access only to users with role 'tenant_admin'.
    """
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

class IsSelfOrTenantAdmin(BasePermission):
    """
    Allows access if the user is accessing their own data or is a tenant admin.
    """
    def has_object_permission(self, request, view, obj):
        return (
            request.user.is_authenticated and (
                obj == request.user or request.user.is_tenant_admin()
            )
        )

class IsAssignedDeveloperOrReadOnly(BasePermission):
    """
    Developers can modify only if assigned. Others can read.
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        if request.method in SAFE_METHODS:
            return True
        if user.is_tenant_admin() or user.role == UserRoles.PROJECT_MANAGER:
            return True
        return obj.assigned_to and obj.assigned_to.user == user

class IsProjectMember(BasePermission):
    """
    Grants access if the user is an active member of the project.
    """
    def has_object_permission(self, request, view, obj):
        employee = request.user.employee
        return obj.members.filter(employee=employee, is_active=True).exists()
